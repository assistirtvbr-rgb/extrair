import { storageService } from './storageService';
import { generateMockPlaces } from './mockDataService';
import { calculateDistance } from '../utils/distance';

export const placesService = {
  /**
   * Search establishments using Cloudflare Worker proxy to Google Places API (New)
   */
  async searchPlaces({ query, locationName = '', latitude, longitude, radiusKm = 5, pageToken = null }) {
    const settings = storageService.getSettings();
    // Default endpoint: relative /api/search when running in Worker or custom
    const workerUrl = window.location.origin.includes('workers.dev') || window.location.origin.includes('localhost')
      ? '/api/search'
      : (settings.workerApiUrl || '/api/search');
      
    const radiusMeters = Math.min(Math.max(Math.round(radiusKm * 1000), 100), 50000);

    const payload = {
      query: query.trim(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: radiusMeters,
      pageToken
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        // Enrich results with distance from query center
        const places = (data.places || []).map(place => {
          const lat = place.location?.latitude || place.lat;
          const lng = place.location?.longitude || place.lng;
          const dist = calculateDistance(latitude, longitude, lat, lng);
          
          return {
            ...place,
            lat,
            lng,
            distanceKm: dist
          };
        });

        return {
          places,
          nextPageToken: data.nextPageToken || null,
          isMock: false,
          total: places.length
        };
      } else {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Worker HTTP ${response.status}`);
      }
    } catch (err) {
      // High-fidelity fallback generating establishments tailored to the searched location
      const mockResults = generateMockPlaces(query, locationName || 'Região Selecionada', latitude, longitude, radiusKm, 20);
      
      return {
        places: mockResults,
        nextPageToken: null,
        isMock: true,
        errorMessage: err.message,
        total: mockResults.length
      };
    }
  },

  /**
   * Search competitors around a specific place (Radar mode)
   */
  async getCompetitors(place, radiusKm = 3) {
    const lat = place.location?.latitude || place.lat;
    const lng = place.location?.longitude || place.lng;
    const category = place.primaryTypeDisplayName?.text || place.category || 'odontologia';
    const address = place.formattedAddress || place.address || '';

    return this.searchPlaces({
      query: category,
      locationName: address,
      latitude: lat,
      longitude: lng,
      radiusKm
    });
  }
};
