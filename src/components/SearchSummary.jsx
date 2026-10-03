import React from 'react';
import { Building2, PhoneCall, Sparkles } from 'lucide-react';

export default function SearchSummary({ places = [], leadStore = {} }) {
  if (!places || places.length === 0) return null;

  const total = places.length;

  // With phone
  const withPhone = places.filter(p => Boolean(p.nationalPhoneNumber || p.internationalPhoneNumber || p.phone)).length;

  // With digital presence (website, instagram, whatsapp, email)
  const withDigital = places.filter(p => {
    const id = p.id || p.place_id;
    const lead = leadStore[id] || {};
    const dp = p.digitalPresence || lead.digitalPresence || {};
    return Boolean(p.websiteUri || p.website || dp.website || dp.instagram?.url || dp.whatsapp?.url || dp.email?.address);
  }).length;

  return (
    <div className="search-insights-bar">
      <div className="insights-metrics">
        <div className="insight-metric-item">
          <Building2 size={15} color="var(--brand-primary)" />
          <span>Empresas exibidas:</span>
          <span className="insight-metric-value">{total}</span>
        </div>

        <div className="insight-metric-item">
          <PhoneCall size={15} color="var(--color-success)" />
          <span>Com telefone direto:</span>
          <span className="insight-metric-value">{withPhone}</span>
        </div>

        <div className="insight-metric-item">
          <Sparkles size={15} color="#D946EF" />
          <span>Presença digital identificada:</span>
          <span className="insight-metric-value">{withDigital}</span>
        </div>
      </div>
    </div>
  );
}
