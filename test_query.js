async function test() {
  const query = 'odontologia';
  const lat = -22.7639;
  const lng = -43.3994;

  console.log('--- Testing Overpass API ---');
  const overpassQL = `[out:json][timeout:15];
  (
    node["healthcare"="dentist"](around:8000,${lat},${lng});
    node["amenity"="dentist"](around:8000,${lat},${lng});
    node["amenity"="clinic"](around:8000,${lat},${lng});
    node["amenity"="hospital"](around:8000,${lat},${lng});
    node["amenity"="pharmacy"](around:8000,${lat},${lng});
    node["shop"](around:8000,${lat},${lng});
    way["amenity"](around:8000,${lat},${lng});
  );
  out center 50;`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: 'data=' + encodeURIComponent(overpassQL),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'LeadMap-App/2.0'
      }
    });
    const data = await res.json();
    console.log('Overpass returned elements:', data.elements ? data.elements.length : 0);
    if (data.elements) {
      data.elements.forEach((e, i) => {
        if (e.tags && (e.tags.name || e.tags['name:pt'])) {
          console.log(`[${i+1}] ${e.tags.name || e.tags['name:pt']} | Type: ${e.tags.amenity || e.tags.healthcare || e.tags.shop} | Phone: ${e.tags.phone || e.tags['contact:phone'] || 'N/A'}`);
        }
      });
    }
  } catch (err) {
    console.error('Overpass error:', err);
  }

  console.log('\n--- Testing Google Maps Web Search Scraping ---');
  try {
    const searchTerms = encodeURIComponent('odontologia dentista em Belford Roxo');
    const gUrl = `https://www.google.com/search?q=${searchTerms}&hl=pt-BR&gl=br`;
    const gRes = await fetch(gUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    console.log('Google search HTTP status:', gRes.status);
    const html = await gRes.text();
    console.log('Google HTML length:', html.length);
    // Check if local pack or place links exist
    const matches = html.match(/class="[^"]*OSrXXb[^"]*"[^>]*>([^<]+)<\/span>/g) || html.match(/data-attrid="title"[^>]*>([^<]+)<\//g) || [];
    console.log('Found title matches:', matches.slice(0, 10));
  } catch (err) {
    console.error('Google test error:', err);
  }
}

test();
