import { storageService } from './storageService';
import { generateMockPlaces } from './mockDataService';
import { calculateDistance } from '../utils/distance';

export const placesService = {
  /**
   * Search establishments with real data (OpenStreetMap Nominatim / Overpass / Google Places API)
   */
  async searchPlaces({
    query,
    locationName = '',
    latitude,
    longitude,
    radiusKm = 5,
    pageToken = null,
    isDemo = false,
    abortSignal = null
  }) {
    const radiusMeters = Math.min(Math.max(Math.round(radiusKm * 1000), 100), 50000);

    // If explicit Demo mode is selected by the user
    if (isDemo) {
      await new Promise(r => setTimeout(r, 180));
      const mockResults = generateMockPlaces(
        query,
        locationName || 'Região Selecionada',
        latitude,
        longitude,
        radiusKm,
        pageToken ? 10 : 20
      );

      return {
        places: mockResults,
        nextPageToken: pageToken ? null : 'demo_page_2_token',
        isMock: true,
        provider: 'Modo Demonstração (Sintético)',
        error: null,
        total: mockResults.length
      };
    }

    // Live Mode via Cloudflare Worker (Fetches 100% real OpenStreetMap / Google Places data)
    const settings = storageService.getSettings();
    const endpoint = settings.workerApiUrl || '/api/search';

    const payload = {
      query: query.trim(),
      locationName: locationName.trim(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: radiusMeters,
      pageToken: pageToken || null
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortSignal
      });

      if (response.ok) {
        const data = await response.json();
        
        let places = (data.places || []).map(place => {
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
          provider: data.provider || 'Dados Reais',
          error: null,
          total: places.length
        };
      } else {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Erro HTTP ${response.status}`);
      }
    } catch (err) {
      if (err.name === 'AbortError') throw err;

      return {
        places: [],
        nextPageToken: null,
        isMock: false,
        provider: 'OpenStreetMap / Google Maps',
        error: { message: err.message || 'Falha ao consultar estabelecimentos.' },
        total: 0
      };
    }
  },

  async getCompetitors(place, radiusKm = 3, isDemo = false) {
    const lat = place.location?.latitude || place.lat;
    const lng = place.location?.longitude || place.lng;
    const category = place.primaryTypeDisplayName?.text || place.category || 'odontologia';
    const address = place.formattedAddress || place.address || '';

    return this.searchPlaces({
      query: category,
      locationName: address,
      latitude: lat,
      longitude: lng,
      radiusKm,
      isDemo
    });
  }
};
