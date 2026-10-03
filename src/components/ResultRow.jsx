import React from 'react';
import { 
  Star, 
  Phone, 
  MapPin, 
  Bookmark, 
  ChevronRight, 
  Radar as RadarIcon, 
  Calendar,
  Sparkles
} from 'lucide-react';
import DigitalPresenceBadge from './DigitalPresenceBadge';
import LeadScoreBadge from './LeadScoreBadge';
import { formatPhone, getCategoryLabel } from '../utils/formatter';
import { formatDistance } from '../utils/distance';

export default function ResultRow({
  place,
  leadData = {},
  isSelected = false,
  isActive = false,
  isFavorite = false,
  onSelect,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onToggleFavorite,
  onOpenRadar
}) {
  const name = place.displayName?.text || place.name || 'Estabelecimento';
  const category = place.primaryTypeDisplayName?.text || place.primaryType || place.category || 'Empresa';
  const address = place.formattedAddress || place.address || 'Endereço não disponível';
  const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || place.phone;
  const rawWeb = place.websiteUri || place.website;
  const rating = place.rating;
  const reviews = place.userRatingCount || 0;
  const distance = place.distanceKm;

  const dp = place.digitalPresence || leadData.digitalPresence || {};
  const status = leadData.status || 'Novo';
  const nextAction = leadData.nextAction;

  return (
    <div
      className={`result-row ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Checkbox */}
      <div className="result-checkbox-col" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(place, e.target.checked)}
          aria-label={`Selecionar ${name}`}
        />
      </div>

      {/* Main Info */}
      <div className="result-info-col" style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span className="result-title" title={name} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name}
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
              {getCategoryLabel(category)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <LeadScoreBadge place={{ ...place, digitalPresence: dp }} leadData={leadData} />
            <span className="badge badge-green" style={{ fontSize: '10.5px' }}>
              {status}
            </span>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={address}>
          {address}
        </div>

        {/* Contact & Digital Presence Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '1px' }}>
          {rating ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11.5px', fontWeight: '600' }} title={`★ ${rating} (${reviews} avaliações)`}>
              <Star size={11} style={{ color: '#EAB308', fill: '#EAB308' }} />
              <span className="tnum">{rating}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>({reviews})</span>
            </span>
          ) : null}

          {distance !== null && distance !== undefined && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              <MapPin size={11} />
              <span className="tnum">{formatDistance(distance)}</span>
            </span>
          )}

          {phone && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              <Phone size={11} />
              <span className="tnum">{formatPhone(phone)}</span>
            </span>
          )}

          {/* Digital Presence Strip */}
          <DigitalPresenceBadge digitalPresence={dp} websiteUrl={rawWeb} onOpenDetails={onClick} />
        </div>

        {/* Next Action reminder if scheduled */}
        {nextAction && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--green-dark)', background: 'var(--green-subtle)', padding: '2px 6px', borderRadius: 'var(--radius-xs)', marginTop: '2px', width: 'fit-content' }}>
            <Calendar size={11} />
            <strong>Próxima ação:</strong> {nextAction}
            {leadData.returnDate && ` (${leadData.returnDate})`}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="result-actions-col" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          className="btn-icon"
          onClick={() => onToggleFavorite(place)}
          title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          style={{ color: isFavorite ? '#EAB308' : 'var(--text-muted)' }}
        >
          <Bookmark size={14} fill={isFavorite ? '#EAB308' : 'none'} />
        </button>

        <button
          className="btn-icon"
          onClick={() => onOpenRadar(place)}
          title="Radar de Concorrentes: Buscar concorrentes próximos"
        >
          <RadarIcon size={14} />
        </button>

        <button
          className="btn-icon"
          onClick={onClick}
          title="Ver ficha comercial completa"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
