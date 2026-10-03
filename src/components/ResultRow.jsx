import React from 'react';
import { 
  Star, 
  Phone, 
  MapPin, 
  Bookmark, 
  ChevronRight, 
  Radar as RadarIcon, 
  Calendar,
  Building
} from 'lucide-react';
import DigitalPresenceBadge from './DigitalPresenceBadge';
import LeadScoreBadge from './LeadScoreBadge';
import { formatPhone, getCategoryLabel } from '../utils/formatter';
import { formatDistance } from '../utils/distance';

function getInitials(name) {
  if (!name) return 'EM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Cliente':
      return 'badge-success';
    case 'Interessado':
      return 'badge-brand';
    case 'Contato realizado':
      return 'badge-brand';
    case 'Contato futuro':
      return 'badge-warning';
    case 'Sem interesse':
      return 'badge-alert';
    default:
      return 'badge-neutral';
  }
}

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

  const dp = { ...(place.socials || {}), ...(place.digitalPresence || {}), ...(leadData.digitalPresence || {}) };
  const status = leadData.status || 'Novo';
  const nextAction = leadData.nextAction;

  return (
    <div
      className={`result-row ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 1. Selection Checkbox */}
      <div onClick={(e) => e.stopPropagation()} style={{ paddingTop: '2px' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(place, e.target.checked)}
          aria-label={`Selecionar ${name}`}
          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
        />
      </div>

      {/* 2. Company Avatar / Initials */}
      <div className="company-avatar" title={name}>
        {getInitials(name)}
      </div>

      {/* 3. Main Business Information */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="result-title" title={name}>
              {name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {getCategoryLabel(category)}
              </span>
              <span>•</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={address}>
                {address}
              </span>
            </div>
          </div>

          {/* Lead Score & Pipeline Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            <LeadScoreBadge place={{ ...place, digitalPresence: dp }} leadData={leadData} />
            <span className={`badge ${getStatusBadgeClass(status)}`} style={{ fontSize: '11px' }}>
              {status}
            </span>
          </div>
        </div>

        {/* Rating, Distance & Contact Meta Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '2px' }}>
          {rating ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '12.5px', fontWeight: '700' }} title={`★ ${rating} (${reviews} avaliações)`}>
              <Star size={13} style={{ color: 'var(--color-warning)', fill: 'var(--color-warning)' }} />
              <span className="tnum">{rating}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: '500', fontSize: '11.5px' }}>({reviews})</span>
            </span>
          ) : null}

          {distance !== null && distance !== undefined && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <MapPin size={12} />
              <span className="tnum">{formatDistance(distance)}</span>
            </span>
          )}

          {phone && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <Phone size={12} />
              <span className="tnum">{formatPhone(phone)}</span>
            </span>
          )}

          {/* Digital Channels Strip */}
          <DigitalPresenceBadge digitalPresence={dp} websiteUrl={rawWeb} onOpenDetails={onClick} />
        </div>

        {/* Next Scheduled Action Reminder */}
        {nextAction && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--brand-primary)', background: 'var(--brand-subtle)', padding: '3px 8px', borderRadius: 'var(--radius-xs)', marginTop: '4px', width: 'fit-content' }}>
            <Calendar size={12} />
            <strong>Próxima ação:</strong> {nextAction}
            {leadData.returnDate && ` (${leadData.returnDate})`}
          </div>
        )}
      </div>

      {/* 4. Action Buttons */}
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '2px', alignSelf: 'center' }}>
        <button
          type="button"
          className="btn-icon"
          onClick={() => onToggleFavorite(place)}
          title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          style={{ color: isFavorite ? 'var(--color-warning)' : 'var(--text-muted)' }}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Bookmark size={16} fill={isFavorite ? 'var(--color-warning)' : 'none'} />
        </button>

        <button
          type="button"
          className="btn-icon"
          onClick={() => onOpenRadar(place)}
          title="Radar de Concorrentes Próximos"
          aria-label="Abrir radar de concorrentes"
        >
          <RadarIcon size={16} />
        </button>

        <button
          type="button"
          className="btn-icon"
          onClick={onClick}
          title="Ver ficha comercial da empresa"
          aria-label="Ver detalhes comerciais"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
