import { storageService } from './storageService';
import { generateMockPlaces } from './mockDataService';
import { calculateDistance } from '../utils/distance';

export const placesService = {
  /**
   * Search establishments with explicit Demo vs Live mode, real pagination and cancellation
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

    // Explicit Demo Mode
    if (isDemo) {
      // Simulate short network delay
      await new Promise(r => setTimeout(r, 200));

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
        error: null,
        total: mockResults.length
      };
    }

    // Live Mode via Cloudflare Worker
    const settings = storageService.getSettings();
    const endpoint = settings.workerApiUrl || '/api/search';

    const payload = {
      query: query.trim(),
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
        
        // Enrich results with distance from search coordinates and validate radius
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
          error: null,
          total: places.length
        };
      } else {
        const errJson = await response.json().catch(() => ({}));
        const errorMessage = errJson.error || `Erro de comunicação com o servidor (HTTP ${response.status}).`;
        const errorCode = errJson.code || 'HTTP_ERROR';

        return {
          places: [],
          nextPageToken: null,
          isMock: false,
          error: {
            message: errorMessage,
            code: errorCode,
            hint: errJson.hint || null
          },
          total: 0
        };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        throw err;
      }

      return {
        places: [],
        nextPageToken: null,
        isMock: false,
        error: {
          message: `Falha de conexão com a API: ${err.message}`,
          code: 'NETWORK_ERROR',
          hint: 'Verifique se o Cloudflare Worker está online ou ative o Modo Demonstração.'
        },
        total: 0
      };
    }
  },

  /**
   * Search nearby competitors for Radar view
   */
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
