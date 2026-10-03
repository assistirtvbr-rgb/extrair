/**
 * Extract clean root domain from website URL
 * e.g., "https://www.clinicadental.com.br/agendamento?ref=123" -> "clinicadental.com.br"
 */
export function extractCleanDomain(url) {
  if (!url || typeof url !== 'string') return '';
  
  try {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    const parsed = new URL(cleanUrl);
    let hostname = parsed.hostname.toLowerCase();
    
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    return hostname;
  } catch {
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^/?#]+)/i);
    return match ? match[1].toLowerCase() : url;
  }
}

/**
 * Normalize and validate external URLs, ensuring https protocol and valid hostname
 */
export function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const withProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    if (!parsed.hostname || !parsed.hostname.includes('.')) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Extract social platform identifier from URL
 */
export function parseSocialChannel(url) {
  if (!url || typeof url !== 'string') return null;
  const normalized = url.trim().toLowerCase();

  if (normalized.includes('instagram.com/')) {
    const match = url.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
    const handle = match && !['p', 'explore', 'stories', 'reel', 'tv'].includes(match[1]) ? match[1] : null;
    return {
      platform: 'instagram',
      label: 'Instagram',
      handle: handle ? `@${handle.replace('@', '')}` : 'Instagram',
      url: handle ? `https://www.instagram.com/${handle.replace('@', '')}/` : url
    };
  }

  if (normalized.includes('facebook.com/')) {
    const match = url.match(/facebook\.com\/([a-zA-Z0-9._-]+)/i);
    const handle = match && !['share', 'sharer', 'pages', 'groups'].includes(match[1]) ? match[1] : null;
    return {
      platform: 'facebook',
      label: 'Facebook',
      handle: handle ? `fb/${handle}` : 'Facebook',
      url
    };
  }

  if (normalized.includes('linkedin.com/')) {
    const match = url.match(/linkedin\.com\/(?:company|in)\/([a-zA-Z0-9._-]+)/i);
    return {
      platform: 'linkedin',
      label: 'LinkedIn',
      handle: match ? match[1] : 'LinkedIn',
      url
    };
  }

  if (normalized.includes('tiktok.com/')) {
    const match = url.match(/tiktok\.com\/@?([a-zA-Z0-9._-]+)/i);
    return {
      platform: 'tiktok',
      label: 'TikTok',
      handle: match ? `@${match[1]}` : 'TikTok',
      url
    };
  }

  if (normalized.includes('youtube.com/') || normalized.includes('youtu.be/')) {
    const match = url.match(/youtube\.com\/(?:@|c\/|channel\/)?([a-zA-Z0-9._-]+)/i);
    return {
      platform: 'youtube',
      label: 'YouTube',
      handle: match ? match[1] : 'YouTube',
      url
    };
  }

  if (normalized.includes('wa.me/') || normalized.includes('api.whatsapp.com') || normalized.includes('whatsapp:')) {
    const numMatch = url.match(/(?:\+?55)?(\d{10,11})/);
    return {
      platform: 'whatsapp',
      label: 'WhatsApp Comercial',
      handle: numMatch ? `(Zap) ${numMatch[1]}` : 'WhatsApp',
      url: normalized.startsWith('http') ? url : `https://wa.me/${numMatch ? numMatch[1] : ''}`
    };
  }

  return null;
}
