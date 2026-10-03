/**
 * Sanitize text to prevent CSV/Excel Formula Injection (CWE-1236)
 * Prepend single quote if value starts with dangerous characters: =, +, -, @, \t, \r
 */
export function sanitizeCSVValue(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Export selected items to CSV format with formula sanitization and safe download
 */
export function exportToCSV(items, selectedFields = {}, filename = 'leadmap-export.csv') {
  if (!items || items.length === 0) return;

  const fieldDefs = [
    { key: 'name', label: 'Empresa', getter: (i) => i.displayName?.text || i.name || '' },
    { key: 'primaryType', label: 'Categoria', getter: (i) => i.primaryTypeDisplayName?.text || i.primaryType || i.category || '' },
    { key: 'phone', label: 'Telefone', getter: (i) => i.nationalPhoneNumber || i.internationalPhoneNumber || i.phone || '' },
    { key: 'whatsapp', label: 'WhatsApp', getter: (i) => i.digitalPresence?.whatsapp?.url || i.digitalPresence?.whatsapp?.handle || '' },
    { key: 'website', label: 'Website', getter: (i) => i.websiteUri || i.website || '' },
    { key: 'instagram', label: 'Instagram', getter: (i) => i.digitalPresence?.instagram?.url || i.digitalPresence?.instagram?.handle || '' },
    { key: 'email', label: 'E-mail Comercial', getter: (i) => i.digitalPresence?.email?.address || '' },
    { key: 'address', label: 'Endereço', getter: (i) => i.formattedAddress || i.address || '' },
    { key: 'rating', label: 'Avaliação (Google)', getter: (i) => i.rating || '' },
    { key: 'userRatingCount', label: 'Total Reviews', getter: (i) => i.userRatingCount || 0 },
    { key: 'distance', label: 'Distância (km)', getter: (i) => i.distanceKm ? i.distanceKm.toFixed(2) : '' },
    { key: 'leadScore', label: 'Score LeadMap (0-100)', getter: (i) => i.scoreData?.totalScore || '' },
    { key: 'crmStatus', label: 'Status Pipeline', getter: (i) => i.crmData?.status || 'Novo' },
    { key: 'nextAction', label: 'Próxima Ação', getter: (i) => i.crmData?.nextAction || '' },
    { key: 'returnDate', label: 'Data de Retorno', getter: (i) => i.crmData?.returnDate || '' },
    { key: 'place_id', label: 'Place ID', getter: (i) => i.id || i.place_id || '' }
  ];

  const activeFields = fieldDefs.filter(f => selectedFields[f.key] !== false);

  const headerRow = activeFields.map(f => `"${f.label.replace(/"/g, '""')}"`).join(',');
  
  const dataRows = items.map(item => {
    return activeFields.map(f => {
      const rawVal = f.getter(item);
      const safeVal = sanitizeCSVValue(rawVal);
      return `"${safeVal.replace(/"/g, '""')}"`;
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
    googleMapsUri: i.googleMapsUri,
    digitalPresence: i.digitalPresence || null,
    crm: i.crmData || null,
    score: i.scoreData || null
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
    const insta = i.digitalPresence?.instagram?.handle ? `Instagram: ${i.digitalPresence.instagram.handle}` : null;
    const zap = i.digitalPresence?.whatsapp?.url ? `WhatsApp: ${i.digitalPresence.whatsapp.url}` : null;
    const address = i.formattedAddress || i.address || '';
    const rating = i.rating ? `★ ${i.rating} (${i.userRatingCount || 0} avaliações)` : 'Sem avaliações';
    const nextAct = i.crmData?.nextAction ? `Próxima ação: ${i.crmData.nextAction}` : null;

    return [
      `${idx + 1}. ${name}`,
      `   Telefone: ${phone}`,
      `   Website: ${site}`,
      insta ? `   ${insta}` : null,
      zap ? `   ${zap}` : null,
      `   Endereço: ${address}`,
      `   Avaliação: ${rating}`,
      nextAct ? `   ${nextAct}` : null
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy', err);
    return false;
  }
}
