/**
 * Service for geocoding addresses and browser geolocation
 */

export const geoService = {
  /**
   * Geocode an address/neighborhood/city to lat/lng
   */
  async geocode(query) {
    if (!query || !query.trim()) return null;

    const trimmed = query.trim();

    // Primary: OpenStreetMap Nominatim with Brazilian focus
    try {
      const sanitized = encodeURIComponent(trimmed);
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
          const address = item.address || {};
          const cityOrTown = address.city || address.town || address.municipality || address.suburb || trimmed;
          const state = address.state ? ` - ${address.state}` : '';
          
          return {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            displayName: `${cityOrTown}${state}`,
            name: trimmed
          };
        }
      }
    } catch (e) {
      console.warn('Nominatim geocode failed, using known coordinates:', e);
    }

    // Common Brazilian locations lookup dictionary
    const commonLocations = {
      'belford roxo': { lat: -22.7639, lng: -43.3994, displayName: 'Belford Roxo - RJ' },
      'nova iguacu': { lat: -22.7562, lng: -43.4608, displayName: 'Nova Iguaçu - RJ' },
      'duque de caxias': { lat: -22.7858, lng: -43.3054, displayName: 'Duque de Caxias - RJ' },
      'sao goncalo': { lat: -22.8268, lng: -43.0537, displayName: 'São Gonçalo - RJ' },
      'niteroi': { lat: -22.8832, lng: -43.1034, displayName: 'Niterói - RJ' },
      'tijuca': { lat: -22.9248, lng: -43.2326, displayName: 'Tijuca, Rio de Janeiro - RJ' },
      'barra da tijuca': { lat: -23.0004, lng: -43.3659, displayName: 'Barra da Tijuca, Rio de Janeiro - RJ' },
      'copacabana': { lat: -22.9711, lng: -43.1822, displayName: 'Copacabana, Rio de Janeiro - RJ' },
      'ipanema': { lat: -22.9836, lng: -43.2045, displayName: 'Ipanema, Rio de Janeiro - RJ' },
      'centro, rio de janeiro': { lat: -22.9068, lng: -43.1729, displayName: 'Centro, Rio de Janeiro - RJ' },
      'sao paulo': { lat: -23.5505, lng: -46.6333, displayName: 'São Paulo - SP' },
      'paulista': { lat: -23.5615, lng: -46.6559, displayName: 'Avenida Paulista, São Paulo - SP' },
      'campinas': { lat: -22.9099, lng: -47.0626, displayName: 'Campinas - SP' },
      'curitiba': { lat: -25.4284, lng: -49.2733, displayName: 'Curitiba - PR' },
      'belo horizonte': { lat: -19.9167, lng: -43.9345, displayName: 'Belo Horizonte - MG' },
      'porto alegre': { lat: -30.0346, lng: -51.2177, displayName: 'Porto Alegre - RS' },
      'salvador': { lat: -12.9777, lng: -38.5016, displayName: 'Salvador - BA' },
      'fortaleza': { lat: -3.7319, lng: -38.5267, displayName: 'Fortaleza - CE' },
      'recife': { lat: -8.0476, lng: -34.8770, displayName: 'Recife - PE' },
      'brasilia': { lat: -15.7975, lng: -47.8919, displayName: 'Brasília - DF' }
    };

    const clean = trimmed.toLowerCase();
    for (const [key, val] of Object.entries(commonLocations)) {
      if (clean.includes(key)) {
        return {
          lat: val.lat,
          lng: val.lng,
          displayName: val.displayName,
          name: trimmed
        };
      }
    }

    return {
      lat: -22.7639,
      lng: -43.3994,
      displayName: trimmed,
      name: trimmed
    };
  },

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
          }
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  }
};
