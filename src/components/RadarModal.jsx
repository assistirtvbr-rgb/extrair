import React, { useState, useEffect } from 'react';
import { X, Radar as RadarIcon, Star, MapPin, Phone, Globe, ExternalLink, Loader2 } from 'lucide-react';
import { placesService } from '../services/placesService';
import { formatPhone, getCategoryLabel } from '../utils/formatter';
import { formatDistance } from '../utils/distance';

export default function RadarModal({
  isOpen,
  place,
  onClose,
  onViewOnMap
}) {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radarRadius, setRadarRadius] = useState(3);

  useEffect(() => {
    if (!isOpen || !place) return;

    let isMounted = true;
    setLoading(true);

    placesService.getCompetitors(place, radarRadius).then(res => {
      if (isMounted) {
        // Filter out the business itself
        const placeId = place.id || place.place_id;
        const comps = (res.places || []).filter(p => (p.id || p.place_id) !== placeId);
        setCompetitors(comps);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [isOpen, place, radarRadius]);

  if (!isOpen || !place) return null;

  const name = place.displayName?.text || place.name;
  const category = place.primaryTypeDisplayName?.text || place.category || 'mesmo segmento';

  const count2km = competitors.filter(c => (c.distanceKm ?? 99) <= 2).length;
  const count5km = competitors.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="empty-state-icon" style={{ width: '32px', height: '32px', margin: 0 }}>
              <RadarIcon size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px' }}>Radar de Concorrência Local</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Análise em torno de <strong>{name}</strong>
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '14px' }}>
          {/* Metrics header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div className="detail-card-box" style={{ textAlign: 'center', padding: '10px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--green-dark)' }}>{count2km}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Concorrentes em 2 km</span>
            </div>

            <div className="detail-card-box" style={{ textAlign: 'center', padding: '10px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--green-accent)' }}>{count5km}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Concorrentes em {radarRadius} km</span>
            </div>

            <div className="detail-card-box" style={{ textAlign: 'center', padding: '10px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#D46B45' }}>
                {competitors.length > 0
                  ? (competitors.reduce((acc, c) => acc + (c.rating || 0), 0) / (competitors.filter(c => c.rating).length || 1)).toFixed(1)
                  : '—'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Nota Média do Setor</span>
            </div>
          </div>

          {/* Radius selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Raio do Radar:
            </span>
            <div className="radius-selector">
              {[1, 2, 3, 5, 10].map(r => (
                <button
                  key={r}
                  type="button"
                  className={`radius-chip ${radarRadius === r ? 'active' : ''}`}
                  onClick={() => setRadarRadius(r)}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>

          {/* Competitors scroll list */}
          <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            {loading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                <span>Rastreando concorrentes na região...</span>
              </div>
            ) : competitors.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Nenhum concorrente direto detectado dentro de {radarRadius} km.
              </div>
            ) : (
              competitors.map((comp, idx) => {
                const cName = comp.displayName?.text || comp.name;
                const cCat = comp.primaryTypeDisplayName?.text || comp.category;
                const cDist = comp.distanceKm;
                const cPhone = comp.nationalPhoneNumber || comp.phone;

                return (
                  <div
                    key={comp.id || comp.place_id || idx}
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: 'var(--bg-panel)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {cName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <span>{getCategoryLabel(cCat)}</span>
                        <span>•</span>
                        <span>{formatDistance(cDist)}</span>
                        {cPhone && (
                          <>
                            <span>•</span>
                            <span>{formatPhone(cPhone)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {comp.rating ? (
                      <span className="result-rating-badge" style={{ fontSize: '12px' }}>
                        <Star size={12} className="result-rating-star" /> {comp.rating}
                      </span>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Fechar
          </button>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => {
              onViewOnMap(place);
              onClose();
            }}
          >
            <MapPin size={14} />
            Visualizar no Mapa
          </button>
        </div>
      </div>
    </div>
  );
}
