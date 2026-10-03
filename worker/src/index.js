/**
 * LeadMap Cloudflare Worker (Unified Backend API + Static Assets SPA)
 * Endpoints:
 * - POST /api/search: Secure Google Places API (New) proxy with pagination and radius validation
 * - POST /api/enrich: SSRF-protected safe digital presence & social channel discovery scraper
 * - GET  /api/health: Status check
 * - *                : Static assets from React build (env.ASSETS)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

function handleCors(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
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

/**
 * SSRF Protection: Checks if hostname resolves to private/internal IP
 */
function isPrivateOrLocalHost(hostname) {
  if (!hostname || typeof hostname !== 'string') return true;
  const lower = hostname.toLowerCase();

  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower.endsWith('.corp')
  ) {
    return true;
  }

  // IPv4 Private Ranges
  const ipMatch = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const oct1 = parseInt(ipMatch[1], 10);
    const oct2 = parseInt(ipMatch[2], 10);
    if (oct1 === 10) return true; // 10.0.0.0/8
    if (oct1 === 172 && oct2 >= 16 && oct2 <= 31) return true; // 172.16.0.0/12
    if (oct1 === 192 && oct2 === 168) return true; // 192.168.0.0/16
    if (oct1 === 127) return true; // 127.0.0.0/8
    if (oct1 === 169 && oct2 === 254) return true; // 169.254.0.0/16 Link-local
    if (oct1 === 0) return true;
  }

  return false;
}

/**
 * Parse HTML content for social channels, whatsapp, mailto and sameAs
 */
function extractDigitalChannelsFromHtml(html, baseUrl) {
  const discovered = {
    website: baseUrl,
    instagram: null,
    facebook: null,
    linkedin: null,
    tiktok: null,
    youtube: null,
    whatsapp: null,
    email: null,
    enrichedAt: new Date().toISOString()
  };

  if (!html || typeof html !== 'string') return discovered;

  // 1. WhatsApp Extraction
  const waMatch = html.match(/href=["'](https?:\/\/(?:wa\.me|api\.whatsapp\.com\/send\?phone=)[^"']+)["']/i) ||
                  html.match(/href=["'](whatsapp:\/\/[^"']+)["']/i);
  if (waMatch) {
    const url = waMatch[1];
    const num = url.match(/\d{10,13}/);
    discovered.whatsapp = {
      platform: 'whatsapp',
      url,
      handle: num ? `(WhatsApp) ${num[0]}` : 'WhatsApp Oficial',
      source: 'Página Web',
      status: 'Encontrado no site',
      discoveredAt: new Date().toISOString()
    };
  }

  // 2. Instagram Extraction
  const instaMatch = html.match(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)\/?)["']/i);
  if (instaMatch && !['p', 'explore', 'stories', 'reel', 'tv', 'direct'].includes(instaMatch[2].toLowerCase())) {
    discovered.instagram = {
      platform: 'instagram',
      url: `https://www.instagram.com/${instaMatch[2].replace('@', '')}/`,
      handle: `@${instaMatch[2].replace('@', '')}`,
      source: 'Página Web',
      status: 'Encontrado no site',
      discoveredAt: new Date().toISOString()
    };
  }

  // 3. Facebook Extraction
  const fbMatch = html.match(/href=["'](https?:\/\/(?:www\.)?facebook\.com\/([a-zA-Z0-9._-]+)\/?)["']/i);
  if (fbMatch && !['sharer', 'share', 'pages', 'groups', 'dialog'].includes(fbMatch[2].toLowerCase())) {
    discovered.facebook = {
      platform: 'facebook',
      url: fbMatch[1],
      handle: fbMatch[2],
      source: 'Página Web',
      status: 'Encontrado no site',
      discoveredAt: new Date().toISOString()
    };
  }

  // 4. LinkedIn Extraction
  const linkedMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9._-]+)\/?)["']/i);
  if (linkedMatch) {
    discovered.linkedin = {
      platform: 'linkedin',
      url: linkedMatch[1],
      handle: linkedMatch[2],
      source: 'Página Web',
      status: 'Encontrado no site',
      discoveredAt: new Date().toISOString()
    };
  }

  // 5. TikTok Extraction
  const tiktokMatch = html.match(/href=["'](https?:\/\/(?:www\.)?tiktok\.com\/@?([a-zA-Z0-9._-]+)\/?)["']/i);
  if (tiktokMatch) {
    discovered.tiktok = {
      platform: 'tiktok',
      url: `https://www.tiktok.com/@${tiktokMatch[2].replace('@', '')}`,
      handle: `@${tiktokMatch[2].replace('@', '')}`,
      source: 'Página Web',
      status: 'Encontrado no site',
      discoveredAt: new Date().toISOString()
    };
  }

  // 6. YouTube Extraction
  const ytMatch = html.match(/href=["'](https?:\/\/(?:www\.)?(?:youtube\.com\/(?:@|c\/|channel\/)?|youtu\.be\/)[a-zA-Z0-9._-]+)["']/i);
  if (ytMatch) {
    discovered.youtube = {
      platform: 'youtube',
      url: ytMatch[1],
      handle: 'Canal YouTube',
      source: 'Página Web',
      status: 'Encontrado no site',
      discoveredAt: new Date().toISOString()
    };
  }

  // 7. Public Commercial Email Extraction (mailto:)
  const mailMatch = html.match(/href=["']mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']/i);
  if (mailMatch) {
    discovered.email = {
      address: mailMatch[1].toLowerCase(),
      source: 'Página Web (mailto)',
      status: 'Encontrado no site',
      discoveredAt: new Date().toISOString()
    };
  }

  return discovered;
}

export default {
  async fetch(request, env, ctx) {
    // Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return handleCors(request);
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/api/health') {
      return jsonResponse({
        status: 'ok',
        service: 'LeadMap Unified Cloudflare Worker',
        hasGoogleApiKey: Boolean(env.GOOGLE_PLACES_API_KEY),
        timestamp: new Date().toISOString()
      });
    }

    // =========================================================================
    // ENDPOINT 1: POST /api/search (Google Places API Proxy)
    // =========================================================================
    if (url.pathname === '/api/search') {
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Método não permitido. Utilize POST.' }, 405);
      }

      if (!env.GOOGLE_PLACES_API_KEY) {
        return jsonResponse({
          error: 'GOOGLE_PLACES_API_KEY não configurada no Cloudflare Worker.',
          code: 'MISSING_API_KEY',
          hint: 'Execute: npx wrangler secret put GOOGLE_PLACES_API_KEY'
        }, 503);
      }

      try {
        const body = await request.json().catch(() => null);
        if (!body) {
          return jsonResponse({ error: 'Payload JSON inválido.' }, 400);
        }

        const { query, latitude, longitude, radius, pageToken } = body;

        if (!query || typeof query !== 'string' || !query.trim()) {
          return jsonResponse({ error: 'Parâmetro "query" é obrigatório.' }, 400);
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return jsonResponse({ error: 'Coordenadas geográficas inválidas.' }, 400);
        }

        const radiusMeters = Math.min(Math.max(parseInt(radius, 10) || 5000, 100), 50000);
        const sanitizedQuery = query.trim().substring(0, 150);

        const googlePlacesUrl = 'https://places.googleapis.com/v1/places:searchText';

        const requestBody = {
          textQuery: sanitizedQuery,
          languageCode: 'pt-BR',
          locationBias: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: radiusMeters
            }
          },
          pageSize: 20
        };

        if (pageToken && typeof pageToken === 'string' && pageToken.trim()) {
          requestBody.pageToken = pageToken.trim();
        }

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
            code: errData.error?.status || 'GOOGLE_API_ERROR',
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
        console.error('Worker search error:', err);
        return jsonResponse({ error: 'Erro no processamento da busca.' }, 500);
      }
    }

    // =========================================================================
    // ENDPOINT 2: POST /api/enrich (Safe Digital Presence Scraper)
    // =========================================================================
    if (url.pathname === '/api/enrich') {
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Método não permitido. Utilize POST.' }, 405);
      }

      try {
        const body = await request.json().catch(() => null);
        if (!body || !body.url) {
          return jsonResponse({ error: 'Parâmetro "url" é obrigatório.' }, 400);
        }

        let targetUrlStr = body.url.trim();
        if (!targetUrlStr.startsWith('http://') && !targetUrlStr.startsWith('https://')) {
          targetUrlStr = 'https://' + targetUrlStr;
        }

        const targetUrl = new URL(targetUrlStr);

        // SSRF Validation: reject internal/private networks
        if (isPrivateOrLocalHost(targetUrl.hostname)) {
          return jsonResponse({ error: 'Acesso a endereços locais ou privados não é permitido.' }, 403);
        }

        // Fetch with 5s timeout & 1.5MB max size limit
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const scrapeResponse = await fetch(targetUrl.href, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadMap-Enricher/2.0',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
          },
          redirect: 'follow',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!scrapeResponse.ok) {
          return jsonResponse({
            error: `Website retornou status HTTP ${scrapeResponse.status}`,
            url: targetUrl.href,
            channels: { website: targetUrl.href }
          }, 200);
        }

        const contentType = scrapeResponse.headers.get('content-type') || '';
        if (!contentType.includes('text/html') && !contentType.includes('xhtml')) {
          return jsonResponse({
            error: 'O recurso não é uma página HTML.',
            channels: { website: targetUrl.href }
          }, 200);
        }

        // Limit HTML reading to first 1.5 MB to prevent memory exhaustion
        const htmlText = (await scrapeResponse.text()).substring(0, 1500000);

        const channels = extractDigitalChannelsFromHtml(htmlText, targetUrl.href);

        return jsonResponse({
          success: true,
          url: targetUrl.href,
          channels
        });

      } catch (err) {
        return jsonResponse({
          error: `Falha na consulta ao website: ${err.message}`,
          channels: { website: body?.url || null }
        }, 200);
      }
    }

    // =========================================================================
    // ENDPOINT 3: Static SPA Assets fallback
    // =========================================================================
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return jsonResponse({
      service: 'LeadMap API Worker',
      message: 'Worker ativo. Para buscar use /api/search ou /api/enrich'
    });
  }
};
