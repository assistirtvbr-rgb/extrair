/**
 * Cloudflare Worker for LeadMap
 * Unifies Frontend (React SPA Assets) and Backend API (/api/search).
 * Proxy to Google Places API (New) with FieldMask protection and API Key security.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

function handleCors(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    // Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return handleCors(request);
    }

    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/api/health') {
      return jsonResponse({
        status: 'ok',
        service: 'LeadMap Cloudflare Worker API',
        placesApiConfigured: Boolean(env.GOOGLE_PLACES_API_KEY),
        timestamp: new Date().toISOString()
      });
    }

    // API Search Endpoint: POST /api/search
    if (url.pathname === '/api/search') {
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Método não permitido. Use POST.' }, 405);
      }

      if (!env.GOOGLE_PLACES_API_KEY) {
        return jsonResponse({
          error: 'Chave GOOGLE_PLACES_API_KEY não configurada no Cloudflare Worker Secrets.',
          hint: 'Execute: npx wrangler secret put GOOGLE_PLACES_API_KEY'
        }, 503);
      }

      try {
        const body = await request.json().catch(() => null);

        if (!body) {
          return jsonResponse({ error: 'Payload JSON inválido.' }, 400);
        }

        const { query, latitude, longitude, radius, pageToken } = body;

        // Validation
        if (!query || typeof query !== 'string' || !query.trim()) {
          return jsonResponse({ error: 'Parâmetro "query" é obrigatório e deve ser texto.' }, 400);
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return jsonResponse({ error: 'Latitude ou longitude inválidas.' }, 400);
        }

        // Clamp radius between 100 meters and 50,000 meters (50km)
        const parsedRadius = Math.min(Math.max(parseInt(radius, 10) || 5000, 100), 50000);
        const sanitizedQuery = query.trim().substring(0, 150);

        // Call Google Places API (New) - SearchText
        const googlePlacesUrl = 'https://places.googleapis.com/v1/places:searchText';

        const requestBody = {
          textQuery: sanitizedQuery,
          languageCode: 'pt-BR',
          locationBias: {
            circle: {
              center: {
                latitude: lat,
                longitude: lng
              },
              radius: parsedRadius
            }
          },
          pageSize: 20
        };

        if (pageToken && typeof pageToken === 'string') {
          requestBody.pageToken = pageToken;
        }

        // Strict FieldMask to request only necessary fields and optimize API cost
        const fieldMask = [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.primaryType',
          'places.primaryTypeDisplayName',
          'places.nationalPhoneNumber',
          'places.internationalPhoneNumber',
          'places.websiteUri',
          'places.rating',
          'places.userRatingCount',
          'places.priceLevel',
          'places.currentOpeningHours',
          'places.businessStatus',
          'places.googleMapsUri',
          'nextPageToken'
        ].join(',');

        const googleResponse = await fetch(googlePlacesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': fieldMask
          },
          body: JSON.stringify(requestBody)
        });

        if (!googleResponse.ok) {
          const errData = await googleResponse.json().catch(() => ({}));
          console.error('Google Places API Error:', errData);
          return jsonResponse({
            error: errData.error?.message || 'Falha na comunicação com a Google Places API.',
            status: googleResponse.status
          }, 502);
        }

        const data = await googleResponse.json();

        return jsonResponse({
          places: data.places || [],
          nextPageToken: data.nextPageToken || null,
          total: (data.places || []).length
        });

      } catch (err) {
        console.error('Worker processing error:', err);
        return jsonResponse({
          error: 'Erro interno no processamento da busca.'
        }, 500);
      }
    }

    // Se houver binding de assets estáticos (React compilado no dist), servir o Front-end SPA
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return jsonResponse({
      service: 'LeadMap API Worker',
      message: 'Worker ativo. Para acessar a API use POST /api/search'
    });
  }
};
