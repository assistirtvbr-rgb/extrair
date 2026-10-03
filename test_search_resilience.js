async function testFastSources() {
  const query = 'dentista';
  const city = 'Belford Roxo';
  const lat = -22.76417;
  const lon = -43.39944;

  console.log('--- 1. Testing Nominatim Category Searches for ' + city + ' ---');
  const catQueries = [
    `amenity=dentist&city=${encodeURIComponent(city)}`,
    `amenity=clinic&city=${encodeURIComponent(city)}`,
    `amenity=doctors&city=${encodeURIComponent(city)}`,
    `healthcare=dentist&city=${encodeURIComponent(city)}`,
    `q=${encodeURIComponent(`${query} ${city}`)}`
  ];

  for (const q of catQueries) {
    const url = `https://nominatim.openstreetmap.org/search?${q}&format=json&addressdetails=1&extratags=1&limit=15`;
    const res = await fetch(url, { headers: { 'User-Agent': 'LeadMap-Fast/1.0' } });
    if (res.ok) {
      const data = await res.json();
      console.log(`Query "${q}" => ${data.length} results`);
      data.forEach(item => console.log('   *', item.name || item.display_name));
    }
  }

  console.log('\n--- 2. Testing Photon Komoot with local bias ---');
  const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(`${query} ${city}`)}&lat=${lat}&lon=${lon}&limit=15`;
  const pRes = await fetch(photonUrl, { headers: { 'User-Agent': 'LeadMap-Fast/1.0' } });
  if (pRes.ok) {
    const pData = await pRes.json();
    console.log(`Photon "${query} ${city}" => ${pData.features?.length || 0} results`);
    pData.features?.forEach((f, i) => {
      const p = f.properties || {};
      const c = f.geometry?.coordinates;
      console.log(`   [${i+1}] ${p.name || p.street || 'Estabelecimento'} | ${p.city || p.county || ''}, ${p.state || ''} | lat: ${c?.[1]}, lon: ${c?.[0]}`);
    });
  }
}

testFastSources();
