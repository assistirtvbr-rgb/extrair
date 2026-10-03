/**
 * Service for geocoding addresses and browser geolocation
 */

export const geoService = {
  /**
   * Geocode an address/neighborhood/city to lat/lng
   */
  async geocode(query) {
    if (!query || !query.trim()) return null;

    // First attempt using free OpenStreetMap Nominatim with Brazilian focus
    try {
      const sanitized = encodeURIComponent(query.trim());
      const url = `https://nominatim.openstreetmap.org/search?q=${sanitized}&format=json&countrycodes=br&limit=1&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9',
          'User-Agent': 'LeadMap-App/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const item = data[0];
          return {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            displayName: item.display_name,
            name: item.name || query
          };
        }
      }
    } catch (e) {
      console.warn('Nominatim geocode failed, trying fallback', e);
    }

    // Default known coordinates for Brazilian locations if offline/rate-limited
    const commonLocations = {
      'tijuca': { lat: -22.9248, lng: -43.2326, displayName: 'Tijuca, Rio de Janeiro - RJ' },
      'tijuca, rio de janeiro': { lat: -22.9248, lng: -43.2326, displayName: 'Tijuca, Rio de Janeiro - RJ' },
      'barra da tijuca': { lat: -23.0004, lng: -43.3659, displayName: 'Barra da Tijuca, Rio de Janeiro - RJ' },
      'copacabana': { lat: -22.9711, lng: -43.1822, displayName: 'Copacabana, Rio de Janeiro - RJ' },
      'ipanema': { lat: -22.9836, lng: -43.2045, displayName: 'Ipanema, Rio de Janeiro - RJ' },
      'botafogo': { lat: -22.9519, lng: -43.1843, displayName: 'Botafogo, Rio de Janeiro - RJ' },
      'centro, rio de janeiro': { lat: -22.9068, lng: -43.1729, displayName: 'Centro, Rio de Janeiro - RJ' },
      'sao paulo': { lat: -23.5505, lng: -43.6333, displayName: 'São Paulo - SP' },
      'paulista': { lat: -23.5615, lng: -46.6559, displayName: 'Avenida Paulista, São Paulo - SP' },
      'moema': { lat: -23.6033, lng: -46.6663, displayName: 'Moema, São Paulo - SP' },
      'pinheiros': { lat: -23.5617, lng: -46.7020, displayName: 'Pinheiros, São Paulo - SP' },
      'belo horizonte': { lat: -19.9167, lng: -43.9345, displayName: 'Belo Horizonte - MG' },
      'curitiba': { lat: -25.4284, lng: -49.2733, displayName: 'Curitiba - PR' },
      'porto alegre': { lat: -30.0346, lng: -51.2177, displayName: 'Porto Alegre - RS' }
    };

    const clean = query.toLowerCase().trim();
    for (const [key, val] of Object.entries(commonLocations)) {
      if (clean.includes(key)) {
        return {
          lat: val.lat,
          lng: val.lng,
          displayName: val.displayName,
          name: query
        };
      }
    }

    // Default fallback: Rio de Janeiro center
    return {
      lat: -22.9068,
      lng: -43.1729,
      displayName: query,
      name: query
    };
  },

  /**
   * Reverse geocode coordinates to human readable name
   */
  async reverseGeocode(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9',
          'User-Agent': 'LeadMap-App/1.0'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        const suburb = address.suburb || address.neighbourhood || address.city_district;
        const city = address.city || address.town || address.municipality;
        const state = address.state;
        if (suburb && city) {
          return `${suburb}, ${city}`;
        }
        return data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch {
      // fallback
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  },

  /**
   * Get user's current GPS position via browser geolocation
   */
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não é suportada pelo seu navegador.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            const name = await geoService.reverseGeocode(lat, lng);
            resolve({ lat, lng, displayName: name, name });
          } catch {
            resolve({ lat, lng, displayName: 'Minha Localização', name: 'Minha Localização' });
          }
        },
        (error) => {
          let message = 'Não foi possível obter sua localização.';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Permissão de localização negada pelo usuário.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = 'Informações de localização indisponíveis.';
          } else if (error.code === error.TIMEOUT) {
            message = 'Tempo limite esgotado ao buscar localização.';
          }
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  }
};
