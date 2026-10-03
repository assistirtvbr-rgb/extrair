/**
 * Accurate Geocoding & Geolocation Service
 * Uses OpenStreetMap Nominatim with strict validation and no silent fallback to wrong cities.
 */

export class LocationNotFoundError extends Error {
  constructor(query) {
    super(`Não foi possível localizar o endereço "${query}". Por favor, informe uma cidade, bairro ou CEP mais específico (ex: "Belford Roxo - RJ" ou "Tijuca, Rio de Janeiro").`);
    this.name = 'LocationNotFoundError';
    this.query = query;
  }
}

export const geoService = {
  /**
   * Geocode an address/neighborhood/city to lat/lng accurately
   */
  async geocode(query, isDemo = false) {
    if (!query || !query.trim()) {
      throw new Error('Digite um endereço, cidade ou bairro para pesquisar.');
    }

    const trimmed = query.trim();

    // 1. Check for Brazilian CEP (8 digits or formatted XXXXX-XXX)
    const cepOnlyDigits = trimmed.replace(/\D/g, '');
    if (cepOnlyDigits.length === 8 && /^\d{8}$/.test(cepOnlyDigits)) {
      try {
        // Try BrasilAPI first (often includes geocoordinates directly)
        const bApiRes = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepOnlyDigits}`);
        if (bApiRes.ok) {
          const bData = await bApiRes.json();
          if (bData.location?.coordinates?.latitude && bData.location?.coordinates?.longitude) {
            const locName = `${bData.neighborhood ? bData.neighborhood + ', ' : ''}${bData.city} - ${bData.state}`;
            return {
              lat: parseFloat(bData.location.coordinates.latitude),
              lng: parseFloat(bData.location.coordinates.longitude),
              displayName: `${locName} (${cepOnlyDigits.replace(/(\d{5})(\d{3})/, '$1-$2')})`,
              name: trimmed
            };
          } else if (bData.city) {
            // Geocode the city/neighborhood via Nominatim
            const searchTerms = `${bData.street ? bData.street + ', ' : ''}${bData.neighborhood ? bData.neighborhood + ', ' : ''}${bData.city} - ${bData.state}, Brasil`;
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerms)}&format=json&countrycodes=br&limit=1`, {
              headers: { 'Accept-Language': 'pt-BR,pt;q=0.9', 'User-Agent': 'LeadMap-App/2.0' }
            });
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData && geoData.length > 0) {
                return {
                  lat: parseFloat(geoData[0].lat),
                  lng: parseFloat(geoData[0].lon),
                  displayName: `${bData.city} - ${bData.state} (${cepOnlyDigits.replace(/(\d{5})(\d{3})/, '$1-$2')})`,
                  name: trimmed
                };
              }
            }
          }
        }

        // Fallback to ViaCEP
        const viaCepRes = await fetch(`https://viacep.com.br/ws/${cepOnlyDigits}/json/`);
        if (viaCepRes.ok) {
          const vData = await viaCepRes.json();
          if (!vData.erro && vData.localidade) {
            const searchTerms = `${vData.logradouro ? vData.logradouro + ', ' : ''}${vData.bairro ? vData.bairro + ', ' : ''}${vData.localidade} - ${vData.uf}, Brasil`;
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerms)}&format=json&countrycodes=br&limit=1`, {
              headers: { 'Accept-Language': 'pt-BR,pt;q=0.9', 'User-Agent': 'LeadMap-App/2.0' }
            });
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData && geoData.length > 0) {
                return {
                  lat: parseFloat(geoData[0].lat),
                  lng: parseFloat(geoData[0].lon),
                  displayName: `${vData.bairro ? vData.bairro + ', ' : ''}${vData.localidade} - ${vData.uf}`,
                  name: trimmed
                };
              }
            }
          }
        }
      } catch (cepErr) {
        console.warn('CEP resolution failed:', cepErr);
      }
    }

    try {
      const sanitized = encodeURIComponent(trimmed);
      const url = `https://nominatim.openstreetmap.org/search?q=${sanitized}&format=json&countrycodes=br&limit=1&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9',
          'User-Agent': 'LeadMap-App/2.0'
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
      console.warn('Nominatim network lookup issue:', e);
    }

    // In Demo mode, provide well-known Brazilian municipal centers if Nominatim is unreachable
    if (isDemo) {
      const knownLocations = {
        'belford roxo': { lat: -22.7639, lng: -43.3994, displayName: 'Belford Roxo - RJ' },
        'nova iguacu': { lat: -22.7562, lng: -43.4608, displayName: 'Nova Iguaçu - RJ' },
        'duque de caxias': { lat: -22.7858, lng: -43.3054, displayName: 'Duque de Caxias - RJ' },
        'sao goncalo': { lat: -22.8268, lng: -43.0537, displayName: 'São Gonçalo - RJ' },
        'niteroi': { lat: -22.8832, lng: -43.1034, displayName: 'Niterói - RJ' },
        'tijuca': { lat: -22.9248, lng: -43.2326, displayName: 'Tijuca, Rio de Janeiro - RJ' },
        'barra da tijuca': { lat: -23.0004, lng: -43.3659, displayName: 'Barra da Tijuca, Rio de Janeiro - RJ' },
        'copacabana': { lat: -22.9711, lng: -43.1822, displayName: 'Copacabana, Rio de Janeiro - RJ' },
        'centro rio': { lat: -22.9068, lng: -43.1729, displayName: 'Centro, Rio de Janeiro - RJ' },
        'sao paulo': { lat: -23.5505, lng: -46.6333, displayName: 'São Paulo - SP' },
        'campinas': { lat: -22.9099, lng: -47.0626, displayName: 'Campinas - SP' },
        'curitiba': { lat: -25.4284, lng: -49.2733, displayName: 'Curitiba - PR' },
        'belo horizonte': { lat: -19.9167, lng: -43.9345, displayName: 'Belo Horizonte - MG' },
        'porto alegre': { lat: -30.0346, lng: -51.2177, displayName: 'Porto Alegre - RS' },
        'brasilia': { lat: -15.7975, lng: -47.8919, displayName: 'Brasília - DF' }
      };

      const lower = trimmed.toLowerCase();
      for (const [key, val] of Object.entries(knownLocations)) {
        if (lower.includes(key)) {
          return {
            lat: val.lat,
            lng: val.lng,
            displayName: val.displayName,
            name: trimmed
          };
        }
      }
    }

    // Never return a wrong city in live mode: explicitly throw error so user refines input
    throw new LocationNotFoundError(trimmed);
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
          'User-Agent': 'LeadMap-App/2.0'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        const suburb = address.suburb || address.neighbourhood || address.city_district;
        const city = address.city || address.town || address.municipality;
        const state = address.state;
        if (suburb && city) {
          return `${suburb}, ${city}${state ? ' - ' + state : ''}`;
        }
        return data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch {
      // fallback
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  },

  /**
   * Browser Geolocation GPS with Fast IP-Geo Fallback
   */
  async getCurrentLocation() {
    // 1. Try Browser HTML5 Geolocation with quick timeout
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const coords = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: false, timeout: 4500, maximumAge: 30000 }
          );
        });

        const name = await geoService.reverseGeocode(coords.lat, coords.lng);
        return {
          lat: coords.lat,
          lng: coords.lng,
          displayName: name,
          name
        };
      } catch (geoErr) {
        console.info('HTML5 Geolocation unavailable, trying IP-Geo fallback...', geoErr.message);
      }
    }

    // 2. Fallback to Cloudflare Worker GeoIP (/api/geoip)
    try {
      const res = await fetch('/api/geoip');
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const name = data.displayName || `${data.city} - ${data.region}`;
          return {
            lat: data.latitude,
            lng: data.longitude,
            displayName: name,
            name
          };
        }
      }
    } catch (e) {
      console.warn('Worker GeoIP failed:', e);
    }

    // 3. Fallback to free public IP-API
    try {
      const ipRes = await fetch('https://ipapi.co/json/');
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData.latitude && ipData.longitude) {
          const name = `${ipData.city} - ${ipData.region_code || ipData.region}`;
          return {
            lat: ipData.latitude,
            lng: ipData.longitude,
            displayName: name,
            name
          };
        }
      }
    } catch (e) {
      console.warn('Public IPAPI fallback failed:', e);
    }

    throw new Error('Não foi possível obter sua localização automaticamente. Por favor, digite a cidade ou CEP no campo de busca.');
  }
};
