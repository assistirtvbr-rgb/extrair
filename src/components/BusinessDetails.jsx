import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  Phone, 
  Globe, 
  MapPin, 
  Copy, 
  Check, 
  ExternalLink, 
  Bookmark, 
  BookmarkPlus, 
  Clock, 
  Tag as TagIcon, 
  Plus, 
  Radar as RadarIcon,
  Building2,
  Share2
} from 'lucide-react';
import { extractCleanDomain } from '../utils/domain';
import { formatPhone, getCategoryLabel } from '../utils/formatter';
import { formatDistance } from '../utils/distance';

const LEAD_STATUS_OPTIONS = [
  { value: 'Novo', label: 'Novo Lead', color: '#6E716B', bg: '#F0EFEA' },
  { value: 'Pesquisar', label: 'Pesquisar Mais', color: '#2F6B8F', bg: '#EDF5F9' },
  { value: 'Contato futuro', label: 'Contato Futuro', color: '#854D0E', bg: '#FEF9C3' },
  { value: 'Contato realizado', label: 'Contato Realizado', color: '#1E40AF', bg: '#DBEAFE' },
  { value: 'Interessado', label: 'Interessado', color: '#166534', bg: '#DCFCE7' },
  { value: 'Sem interesse', label: 'Sem Interesse', color: '#991B1B', bg: '#FEE2E2' },
  { value: 'Cliente', label: 'Cliente Ativo', color: '#183D32', bg: '#DDEBE5' }
];

const PRESET_TAGS = [
  'Clínica grande',
  'Site desatualizado',
  'Sem Instagram',
  'Alta avaliação',
  'Concorrente direto',
  'Cliente potencial',
  'Telefone inválido',
  'Ótima localização'
];

export default function BusinessDetails({
  isOpen,
  place,
  onClose,
  isFavorite = false,
  onToggleFavorite,
  onAddToList,
  onOpenRadar,
  leadMeta = {},
  onUpdateLeadMeta
}) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [status, setStatus] = useState(leadMeta.status || 'Novo');
  const [tags, setTags] = useState(leadMeta.tags || []);
  const [notes, setNotes] = useState(leadMeta.notes || '');
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    if (place) {
      const placeId = place.id || place.place_id;
      setStatus(leadMeta.status || 'Novo');
      setTags(leadMeta.tags || []);
      setNotes(leadMeta.notes || '');
    }
  }, [place, leadMeta]);

  if (!isOpen || !place) return null;

  const placeId = place.id || place.place_id;
  const name = place.displayName?.text || place.name || 'Estabelecimento';
  const category = place.primaryTypeDisplayName?.text || place.primaryType || place.category || 'Empresa';
  const address = place.formattedAddress || place.address || 'Endereço não informado';
  const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || place.phone;
  const rawWeb = place.websiteUri || place.website;
  const cleanDomain = extractCleanDomain(rawWeb);
  const rating = place.rating;
  const reviews = place.userRatingCount || 0;
  const distance = place.distanceKm;
  const mapsUrl = place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;
  const hours = place.currentOpeningHours?.weekdayDescriptions || [];
  const isOpenNow = place.currentOpeningHours?.openNow;

  const handleCopyPhone = () => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    onUpdateLeadMeta(placeId, { status: newStatus, tags, notes });
  };

  const handleNotesBlur = () => {
    onUpdateLeadMeta(placeId, { status, tags, notes });
  };

  const handleAddTag = (tagToAdd) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    const updatedTags = [...tags, trimmed];
    setTags(updatedTags);
    setNewTagInput('');
    setShowTagInput(false);
    onUpdateLeadMeta(placeId, { status, tags: updatedTags, notes });
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = tags.filter(t => t !== tagToRemove);
    setTags(updatedTags);
    onUpdateLeadMeta(placeId, { status, tags: updatedTags, notes });
  };

  return (
    <aside className="business-details-drawer open" aria-label="Detalhes do Estabelecimento">
      {/* Header */}
      <div className="drawer-header">
        <div className="drawer-title-box">
          <h2>{name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span className="result-category-badge">{getCategoryLabel(category)}</span>
            {isOpenNow !== undefined && (
              <span className={`badge ${isOpenNow ? 'badge-green' : 'badge-alert'}`}>
                {isOpenNow ? 'Aberto agora' : 'Fechado no momento'}
              </span>
            )}
          </div>
        </div>

        <button className="btn-icon" onClick={onClose} aria-label="Fechar painel">
          <X size={18} />
        </button>
      </div>

      <div className="drawer-body">
        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => onAddToList(place)}
            style={{ flex: 1 }}
          >
            <BookmarkPlus size={14} />
            Adicionar à lista
          </button>

          <button
            className={`btn btn-secondary btn-sm ${isFavorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(place)}
            title="Favoritar estabelecimento"
          >
            <Bookmark size={14} fill={isFavorite ? '#EAB308' : 'none'} color={isFavorite ? '#EAB308' : 'currentColor'} />
            {isFavorite ? 'Favorito' : 'Favoritar'}
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onOpenRadar(place)}
            title="Buscar concorrentes próximos"
          >
            <RadarIcon size={14} />
            Radar
          </button>
        </div>

        {/* Lead Qualification & CRM Status */}
        <div className="detail-section">
          <label className="detail-section-title">Qualificação do Lead (CRM)</label>
          <div className="detail-card-box">
            <div className="detail-item-row">
              <span className="detail-item-label">Status do contato:</span>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="status-badge-selector"
              >
                {LEAD_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="detail-item-label" style={{ fontSize: '12px' }}>
                  <TagIcon size={13} /> Tags comerciais:
                </span>
                <button
                  className="btn-ghost btn-sm"
                  style={{ padding: '2px 6px', fontSize: '11px', color: 'var(--green-accent)' }}
                  onClick={() => setShowTagInput(!showTagInput)}
                >
                  <Plus size={12} /> Adicionar tag
                </button>
              </div>

              {showTagInput && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                  <input
                    type="text"
                    placeholder="Nome da tag (ex: Potencial alto)"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(newTagInput);
                      }
                    }}
                    style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => handleAddTag(newTagInput)}>
                    OK
                  </button>
                </div>
              )}

              <div className="tags-list">
                {tags.map(tag => (
                  <span key={tag} className="tag-pill">
                    {tag}
                    <span className="remove-tag-btn" onClick={() => handleRemoveTag(tag)}>×</span>
                  </span>
                ))}
                {tags.length === 0 && !showTagInput && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nenhuma tag adicionada.</span>
                )}
              </div>

              {/* Tag suggestions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {PRESET_TAGS.filter(t => !tags.includes(t)).slice(0, 4).map(preset => (
                  <button
                    key={preset}
                    className="quick-chip"
                    style={{ fontSize: '10px', padding: '1px 6px' }}
                    onClick={() => handleAddTag(preset)}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Location Details */}
        <div className="detail-section">
          <label className="detail-section-title">Informações de Contato & Endereço</label>
          <div className="detail-card-box">
            {/* Phone */}
            <div className="detail-item-row">
              <span className="detail-item-label">
                <Phone size={14} /> Telefone
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="detail-item-value">{phone ? formatPhone(phone) : 'Não informado'}</span>
                {phone && (
                  <button
                    className="btn-icon"
                    onClick={handleCopyPhone}
                    title={copiedPhone ? 'Copiado!' : 'Copiar telefone'}
                    style={{ padding: '3px' }}
                  >
                    {copiedPhone ? <Check size={14} color="var(--green-accent)" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>

            {/* Website */}
            <div className="detail-item-row">
              <span className="detail-item-label">
                <Globe size={14} /> Website
              </span>
              <div className="detail-item-value">
                {rawWeb ? (
                  <a 
                    href={rawWeb} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--green-accent)', fontWeight: '600' }}
                  >
                    {cleanDomain}
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Sem website cadastrado</span>
                )}
              </div>
            </div>

            {/* Address */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="detail-item-label">
                  <MapPin size={14} /> Endereço completo
                </span>
                <button
                  className="btn-icon"
                  onClick={handleCopyAddress}
                  title={copiedAddress ? 'Copiado!' : 'Copiar endereço'}
                  style={{ padding: '3px' }}
                >
                  {copiedAddress ? <Check size={14} color="var(--green-accent)" /> : <Copy size={14} />}
                </button>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                {address}
              </p>
            </div>

            {/* Distance & Maps link */}
            <div className="detail-item-row" style={{ paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
              <span className="detail-item-label">Distância da busca:</span>
              <span className="detail-item-value">{formatDistance(distance)}</span>
            </div>

            <div className="detail-item-row">
              <span className="detail-item-label">Google Maps:</span>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', padding: '3px 8px' }}
              >
                Abrir no Maps <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>

        {/* Reputation & Reviews */}
        <div className="detail-section">
          <label className="detail-section-title">Avaliações & Reputação</label>
          <div className="detail-card-box">
            <div className="detail-item-row">
              <span className="detail-item-label">Avaliação média:</span>
              <span className="detail-item-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={14} className="result-rating-star" />
                {rating ? `${rating} / 5.0` : 'Sem nota'}
              </span>
            </div>

            <div className="detail-item-row">
              <span className="detail-item-label">Total de avaliações:</span>
              <span className="detail-item-value">{reviews} reviews</span>
            </div>

            {placeId && (
              <div className="detail-item-row">
                <span className="detail-item-label">Place ID:</span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {placeId.length > 20 ? placeId.substring(0, 18) + '...' : placeId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Hours of Operation */}
        {hours.length > 0 && (
          <div className="detail-section">
            <label className="detail-section-title">Horário de Funcionamento</label>
            <div className="detail-card-box" style={{ gap: '6px' }}>
              {hours.map((line, idx) => (
                <div key={idx} style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commercial Notes / Observações */}
        <div className="detail-section">
          <label className="detail-section-title">Observações Comerciais & Anotações</label>
          <textarea
            className="notes-textarea"
            placeholder="Digite notas sobre a empresa, tomador de decisão, histórico de contato ou proposta enviada..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            As notas são salvas automaticamente no armazenamento local.
          </span>
        </div>
      </div>
    </aside>
  );
}
