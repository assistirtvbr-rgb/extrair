/**
 * Extract clean root domain from website URL
 * e.g., "https://www.clinicadental.com.br/agendamento" -> "clinicadental.com.br"
 */
export function extractCleanDomain(url) {
  if (!url || typeof url !== 'string') return '';
  
  try {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    const parsed = new URL(cleanUrl);
    let hostname = parsed.hostname;
    
    // Remove leading www.
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    return hostname;
  } catch {
    // Fallback regex if URL constructor fails
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^/]+)/i);
    return match ? match[1] : url;
  }
}
