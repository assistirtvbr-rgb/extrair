import { storageService } from './storageService';
import { parseSocialChannel } from '../utils/domain';

export const enrichmentService = {
  /**
   * Enrich a single establishment's digital presence
   */
  async enrichLead(place, abortSignal = null) {
    const placeId = place.id || place.place_id;
    const website = place.websiteUri || place.website;

    if (!website) {
      return {
        success: false,
        reason: 'SEM_WEBSITE',
        message: 'Estabelecimento sem website institucional para análise automática.',
        channels: {
          website: null,
          instagram: null,
          whatsapp: null,
          facebook: null,
          linkedin: null,
          tiktok: null,
          youtube: null,
          email: null
        }
      };
    }

    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: website, placeId }),
        signal: abortSignal
      });

      if (response.ok) {
        const data = await response.json();
        const channels = data.channels || {};

        // Merge with existing manual confirmations if any
        const existingLead = storageService.getLead(placeId);
        const existingDP = existingLead.digitalPresence || {};

        const mergedDP = {
          ...channels,
          ...existingDP // manual overrides take precedence
        };

        storageService.updateLead(placeId, { digitalPresence: mergedDP }, place);

        return {
          success: true,
          channels: mergedDP
        };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      if (err.name === 'AbortError') throw err;

      // Fallback: extract social channel if the website URL itself is an Instagram/Facebook link
      const directSocial = parseSocialChannel(website);
      const fallbackDP = {
        website,
        instagram: directSocial?.platform === 'instagram' ? { ...directSocial, status: 'Encontrado no site' } : null,
        whatsapp: directSocial?.platform === 'whatsapp' ? { ...directSocial, status: 'Encontrado no site' } : null,
        facebook: directSocial?.platform === 'facebook' ? { ...directSocial, status: 'Encontrado no site' } : null,
        linkedin: directSocial?.platform === 'linkedin' ? { ...directSocial, status: 'Encontrado no site' } : null,
        tiktok: directSocial?.platform === 'tiktok' ? { ...directSocial, status: 'Encontrado no site' } : null,
        youtube: directSocial?.platform === 'youtube' ? { ...directSocial, status: 'Encontrado no site' } : null,
        email: null,
        error: err.message
      };

      storageService.updateLead(placeId, { digitalPresence: fallbackDP }, place);

      return {
        success: false,
        error: err.message,
        channels: fallbackDP
      };
    }
  },

  /**
   * Batch enrich a list of establishments with live progress feedback and cancellation
   */
  async enrichBatch(places, onProgress, abortSignal) {
    const results = [];
    const total = places.length;

    for (let i = 0; i < total; i++) {
      if (abortSignal?.aborted) {
        throw new Error('Enriquecimento cancelado pelo usuário.');
      }

      const place = places[i];
      if (onProgress) {
        onProgress({
          completed: i,
          total,
          percent: Math.round((i / total) * 100),
          currentName: place.displayName?.text || place.name
        });
      }

      try {
        const res = await this.enrichLead(place, abortSignal);
        results.push({ placeId: place.id || place.place_id, ...res });
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        results.push({ placeId: place.id || place.place_id, success: false, error: err.message });
      }

      // Short delay between requests to be polite
      await new Promise(r => setTimeout(r, 120));
    }

    if (onProgress) {
      onProgress({ completed: total, total, percent: 100, currentName: 'Concluído!' });
    }

    return results;
  },

  /**
   * Generate clean Google Search URL to search social profile externally
   */
  getSearchUrlForPlatform(companyName, city, platform = 'instagram') {
    const q = encodeURIComponent(`"${companyName}" ${city} ${platform}`);
    return `https://www.google.com/search?q=${q}`;
  }
};
