import React from 'react';
import { Star, Phone, Globe, Navigation, LayoutList, Table as TableIcon } from 'lucide-react';
import { formatDistance } from '../utils/distance';

export default function SearchSummary({ 
  places = [], 
  displayMode = 'list', 
  setDisplayMode 
}) {
  if (!places || places.length === 0) return null;

  const total = places.length;
  
  // Calculate stats
  const validRatings = places.filter(p => p.rating && p.rating > 0);
  const avgRating = validRatings.length > 0 
    ? (validRatings.reduce((acc, p) => acc + p.rating, 0) / validRatings.length).toFixed(1)
    : '—';

  const withPhoneCount = places.filter(p => p.nationalPhoneNumber || p.internationalPhoneNumber || p.phone).length;
  const phonePercent = Math.round((withPhoneCount / total) * 100);

  const withWebCount = places.filter(p => p.websiteUri || p.website).length;
  const webPercent = Math.round((withWebCount / total) * 100);

  const validDistances = places.filter(p => p.distanceKm !== null && p.distanceKm !== undefined);
  const avgDistance = validDistances.length > 0
    ? (validDistances.reduce((acc, p) => acc + p.distanceKm, 0) / validDistances.length)
    : null;

  return (
    <div className="search-insights-bar">
      <div className="insights-metrics">
        <div className="insight-metric-item">
          <span className="insight-metric-value">{total}</span>
          <span className="insight-metric-label">{total === 1 ? 'local' : 'locais'}</span>
        </div>

        <div style={{ color: 'var(--border-color)' }}>•</div>

        <div className="insight-metric-item">
          <Star size={13} className="result-rating-star" />
          <span className="insight-metric-value">{avgRating}</span>
          <span className="insight-metric-label">nota média</span>
        </div>

        <div style={{ color: 'var(--border-color)' }}>•</div>

        <div className="insight-metric-item">
          <span className="insight-metric-value">{phonePercent}%</span>
          <span className="insight-metric-label">com telefone</span>
        </div>

        <div style={{ color: 'var(--border-color)' }}>•</div>

        <div className="insight-metric-item">
          <span className="insight-metric-value">{webPercent}%</span>
          <span className="insight-metric-label">com website</span>
        </div>

        {avgDistance !== null && (
          <>
            <div style={{ color: 'var(--border-color)' }}>•</div>
            <div className="insight-metric-item">
              <span className="insight-metric-value">{formatDistance(avgDistance)}</span>
              <span className="insight-metric-label">distância média</span>
            </div>
          </>
        )}
      </div>

      <div className="insights-tools">
        <div className="radius-selector" style={{ padding: '1px' }}>
          <button
            className={`radius-chip ${displayMode === 'list' ? 'active' : ''}`}
            onClick={() => setDisplayMode('list')}
            title="Visualização em Lista / Diretório"
          >
            <LayoutList size={13} />
          </button>
          <button
            className={`radius-chip ${displayMode === 'table' ? 'active' : ''}`}
            onClick={() => setDisplayMode('table')}
            title="Visualização em Tabela Avançada"
          >
            <TableIcon size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
