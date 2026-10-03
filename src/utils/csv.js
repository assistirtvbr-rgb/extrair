/**
 * Export selected items to CSV format and trigger browser download
 */
export function exportToCSV(items, selectedFields = {}, filename = 'leadmap-export.csv') {
  if (!items || items.length === 0) return;

  const fieldDefs = [
    { key: 'name', label: 'Empresa', getter: (i) => i.displayName?.text || i.name || '' },
    { key: 'primaryType', label: 'Categoria', getter: (i) => i.primaryTypeDisplayName?.text || i.primaryType || i.category || '' },
    { key: 'phone', label: 'Telefone', getter: (i) => i.nationalPhoneNumber || i.internationalPhoneNumber || i.phone || '' },
    { key: 'website', label: 'Website', getter: (i) => i.websiteUri || i.website || '' },
    { key: 'address', label: 'Endereço', getter: (i) => i.formattedAddress || i.address || '' },
    { key: 'rating', label: 'Avaliação', getter: (i) => i.rating || '' },
    { key: 'userRatingCount', label: 'Reviews', getter: (i) => i.userRatingCount || 0 },
    { key: 'distance', label: 'Distância (km)', getter: (i) => i.distanceKm ? i.distanceKm.toFixed(2) : '' },
    { key: 'latitude', label: 'Latitude', getter: (i) => i.location?.latitude || i.lat || '' },
    { key: 'longitude', label: 'Longitude', getter: (i) => i.location?.longitude || i.lng || '' },
    { key: 'place_id', label: 'Place ID', getter: (i) => i.id || i.place_id || '' }
  ];

  // Filter fields based on selected checkboxes or default all
  const activeFields = fieldDefs.filter(f => selectedFields[f.key] !== false);

  const headerRow = activeFields.map(f => `"${f.label.replace(/"/g, '""')}"`).join(',');
  
  const dataRows = items.map(item => {
    return activeFields.map(f => {
      const val = String(f.getter(item) ?? '');
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export selected items to formatted JSON file
 */
export function exportToJSON(items, filename = 'leadmap-export.json') {
  if (!items || items.length === 0) return;
  
  const formatted = items.map(i => ({
    id: i.id || i.place_id,
    name: i.displayName?.text || i.name,
    category: i.primaryTypeDisplayName?.text || i.primaryType || i.category,
    phone: i.nationalPhoneNumber || i.internationalPhoneNumber || i.phone,
    website: i.websiteUri || i.website,
    address: i.formattedAddress || i.address,
    rating: i.rating,
    userRatingCount: i.userRatingCount,
    distanceKm: i.distanceKm,
    latitude: i.location?.latitude || i.lat,
    longitude: i.location?.longitude || i.lng,
    googleMapsUri: i.googleMapsUri
  }));

  const jsonString = JSON.stringify(formatted, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy formatted list to clipboard
 */
export async function copyToClipboard(items) {
  if (!items || items.length === 0) return false;
  
  const text = items.map((i, idx) => {
    const name = i.displayName?.text || i.name;
    const phone = i.nationalPhoneNumber || i.phone || 'Sem telefone';
    const site = i.websiteUri || i.website || 'Sem site';
    const address = i.formattedAddress || i.address || '';
    const rating = i.rating ? `★ ${i.rating} (${i.userRatingCount || 0})` : 'Sem avaliações';
    return `${idx + 1}. ${name}\n   Telefone: ${phone}\n   Website: ${site}\n   Endereço: ${address}\n   Avaliação: ${rating}`;
  }).join('\n\n');

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy', err);
    return false;
  }
}
