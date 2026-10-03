import { storageService } from './storageService';
import { generateMockPlaces } from './mockDataService';
import { calculateDistance } from '../utils/distance';

export const placesService = {
  /**
   * Search establishments using Cloudflare Worker proxy to Google Places API (New)
   */
  async searchPlaces({ query, latitude, longitude, radiusKm = 5, pageToken = null }) {
    const settings = storageService.getSettings();
    const workerUrl = settings.workerApiUrl || 'http://localhost:8787/api/search';
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
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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
        console.warn('Worker returned error, using fallback:', errJson);
        throw new Error(errJson.error || `Worker HTTP ${response.status}`);
      }
    } catch (err) {
      console.info('Using high-fidelity local mock data provider:', err.message);
      
      // Generate realistic mock data matching the query location & radius
      const mockResults = generateMockPlaces(query, latitude, longitude, radiusKm, 18);
      
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

    return this.searchPlaces({
      query: category,
      latitude: lat,
      longitude: lng,
      radiusKm
    });
  }
};
