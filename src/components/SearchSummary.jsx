import React from 'react';
import { Star, Phone, Globe, MessageCircle } from 'lucide-react';
import { formatDistance } from '../utils/distance';

export default function SearchSummary({ 
  places = [], 
  leadStore = {}
}) {
  if (!places || places.length === 0) return null;

  const total = places.length;
  
  const validRatings = places.filter(p => p.rating && p.rating > 0);
  const avgRating = validRatings.length > 0 
    ? (validRatings.reduce((acc, p) => acc + p.rating, 0) / validRatings.length).toFixed(1)
    : '—';

  const withPhoneCount = places.filter(p => p.nationalPhoneNumber || p.internationalPhoneNumber || p.phone).length;
  const phonePercent = Math.round((withPhoneCount / total) * 100);

  const withWebCount = places.filter(p => p.websiteUri || p.website).length;
  const webPercent = Math.round((withWebCount / total) * 100);

  const withWhatsAppCount = places.filter(p => {
    const id = p.id || p.place_id;
    const lead = leadStore[id] || {};
    const dp = p.digitalPresence || lead.digitalPresence || {};
    return Boolean(dp.whatsapp?.url || dp.whatsapp?.handle);
  }).length;
  const waPercent = Math.round((withWhatsAppCount / total) * 100);

  const validDistances = places.filter(p => p.distanceKm !== null && p.distanceKm !== undefined);
  const avgDistance = validDistances.length > 0
    ? (validDistances.reduce((acc, p) => acc + p.distanceKm, 0) / validDistances.length)
    : null;

  return (
    <div className="search-insights-bar">
      <div className="insights-metrics">
        <div className="insight-metric-item">
          <span className="insight-metric-value tnum">{total}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{total === 1 ? 'local' : 'locais'}</span>
        </div>

        <div style={{ color: 'var(--border-color)' }}>•</div>

        <div className="insight-metric-item">
          <Star size={12} style={{ color: '#EAB308', fill: '#EAB308' }} />
          <span className="insight-metric-value tnum">{avgRating}</span>
          <span style={{ color: 'var(--text-secondary)' }}>média</span>
        </div>

        <div style={{ color: 'var(--border-color)' }}>•</div>

        <div className="insight-metric-item">
          <Phone size={12} color="var(--text-secondary)" />
          <span className="insight-metric-value tnum">{phonePercent}%</span>
          <span style={{ color: 'var(--text-secondary)' }}>com telefone</span>
        </div>

        <div style={{ color: 'var(--border-color)' }}>•</div>

        <div className="insight-metric-item">
          <Globe size={12} color="var(--text-secondary)" />
          <span className="insight-metric-value tnum">{webPercent}%</span>
          <span style={{ color: 'var(--text-secondary)' }}>com site</span>
        </div>

        {waPercent > 0 && (
          <>
            <div style={{ color: 'var(--border-color)' }}>•</div>
            <div className="insight-metric-item">
              <MessageCircle size={12} color="#128C7E" />
              <span className="insight-metric-value tnum">{waPercent}%</span>
              <span style={{ color: 'var(--text-secondary)' }}>com WhatsApp</span>
            </div>
          </>
        )}

        {avgDistance !== null && (
          <>
            <div style={{ color: 'var(--border-color)' }}>•</div>
            <div className="insight-metric-item">
              <span className="insight-metric-value tnum">{formatDistance(avgDistance)}</span>
              <span style={{ color: 'var(--text-secondary)' }}>raio médio</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
