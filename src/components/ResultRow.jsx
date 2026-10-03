import React from 'react';
import { 
  Star, 
  Phone, 
  Globe, 
  MapPin, 
  Bookmark, 
  ChevronRight, 
  Radar as RadarIcon, 
  MoreVertical 
} from 'lucide-react';
import { extractCleanDomain } from '../utils/domain';
import { formatPhone, getCategoryLabel } from '../utils/formatter';
import { formatDistance } from '../utils/distance';

export default function ResultRow({
  place,
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
  const name = place.displayName?.text || place.name || 'Estabelecimento sem nome';
  const category = place.primaryTypeDisplayName?.text || place.primaryType || place.category || 'Empresa';
  const address = place.formattedAddress || place.address || 'Endereço não disponível';
  const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || place.phone;
  const rawWeb = place.websiteUri || place.website;
  const cleanDomain = extractCleanDomain(rawWeb);
  const rating = place.rating;
  const reviews = place.userRatingCount || 0;
  const distance = place.distanceKm;

  return (
    <div
      className={`result-row ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Selection Checkbox */}
      <div className="result-checkbox-col" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(place, e.target.checked)}
          aria-label={`Selecionar ${name}`}
        />
      </div>

      {/* Main Info */}
      <div className="result-info-col">
        <div className="result-header-line">
          <span className="result-title" title={name}>{name}</span>
          <span className="result-category-badge">{getCategoryLabel(category)}</span>
        </div>

        <div className="result-address-line" title={address}>
          {address}
        </div>

        <div className="result-meta-line">
          {rating ? (
            <span className="result-rating-badge" title={`Nota ${rating} baseada em ${reviews} avaliações`}>
              <Star size={12} className="result-rating-star" />
              <span>{rating}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '11px' }}>
                ({reviews})
              </span>
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Sem avaliações</span>
          )}

          {distance !== null && distance !== undefined && (
            <span className="contact-item" style={{ fontSize: '11px' }}>
              <MapPin size={11} />
              {formatDistance(distance)}
            </span>
          )}

          {phone && (
            <span className="contact-item" title={phone}>
              <Phone size={11} />
              <span>{formatPhone(phone)}</span>
            </span>
          )}

          {cleanDomain && (
            <span className="contact-item" title={rawWeb} onClick={(e) => e.stopPropagation()}>
              <Globe size={11} />
              <a href={rawWeb} target="_blank" rel="noopener noreferrer">
                {cleanDomain}
              </a>
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="result-actions-col" onClick={(e) => e.stopPropagation()}>
        <button
          className={`btn-icon ${isFavorite ? 'active' : ''}`}
          onClick={() => onToggleFavorite(place)}
          title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          style={{ color: isFavorite ? '#EAB308' : 'var(--text-muted)' }}
        >
          <Bookmark size={15} fill={isFavorite ? '#EAB308' : 'none'} />
        </button>

        <button
          className="btn-icon"
          onClick={() => onOpenRadar(place)}
          title="Radar de Concorrentes: Ver concorrentes próximos"
        >
          <RadarIcon size={15} />
        </button>

        <button
          className="btn-icon"
          onClick={onClick}
          title="Ver detalhes completos do lead"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
