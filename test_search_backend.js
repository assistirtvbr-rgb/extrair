async function testPhotonAndNominatim() {
  const lat = -22.76417;
  const lon = -43.39944;

  console.log('--- 1. Testing Photon Komoot (Fast OpenStreetMap Search) ---');
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent('dentista')}&lat=${lat}&lon=${lon}&limit=20`;
    const res = await fetch(photonUrl, { headers: { 'User-Agent': 'LeadMap/1.0' } });
    const data = await res.json();
    console.log(`Photon "dentista" returned ${data.features?.length || 0} results:`);
    data.features?.forEach((f, idx) => {
      const p = f.properties || {};
      const coords = f.geometry?.coordinates;
      console.log(` [${idx+1}] ${p.name || p.street || 'Estabelecimento'} | ${p.city || p.county || ''}, ${p.state || ''} | lat: ${coords?.[1]}, lon: ${coords?.[0]}`);
    });
  } catch (e) {
    console.error('Photon error:', e.message);
  }

  console.log('\n--- 2. Testing Nominatim with query "odontologia Belford Roxo" ---');
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent('clinica Belford Roxo')}&format=json&addressdetails=1&extratags=1&limit=10`;
    const res = await fetch(nomUrl, { headers: { 'User-Agent': 'LeadMap/1.0' } });
    const list = await res.json();
    console.log(`Nominatim returned ${list.length} results:`);
    list.forEach(item => console.log(' -', item.name || item.display_name));
  } catch (e) {
    console.error('Nominatim error:', e.message);
  }
}

testPhotonAndNominatim();
