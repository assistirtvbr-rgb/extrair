import React, { useState, useEffect } from 'react';
import { 
  X, 
  Phone, 
  Globe, 
  MapPin, 
  Copy, 
  Check, 
  ExternalLink, 
  Bookmark, 
  BookmarkPlus, 
  Radar as RadarIcon,
  Sparkles,
  MessageCircle,
  Instagram,
  Linkedin,
  Facebook,
  Mail,
  Calendar,
  Search,
  CheckCircle2,
  Tag as TagIcon,
  Loader2,
  Navigation
} from 'lucide-react';
import { extractCleanDomain } from '../utils/domain';
import { formatPhone, getCategoryLabel } from '../utils/formatter';
import { formatDistance } from '../utils/distance';
import { calculateLeadScore } from '../utils/scoring';
import { enrichmentService } from '../services/enrichmentService';

const LEAD_STATUS_OPTIONS = [
  { value: 'Novo', label: 'Novo Lead' },
  { value: 'Pesquisar', label: 'Pesquisar Mais' },
  { value: 'Contato futuro', label: 'Contato Futuro' },
  { value: 'Contato realizado', label: 'Contato Realizado' },
  { value: 'Interessado', label: 'Interessado' },
  { value: 'Sem interesse', label: 'Sem Interesse' },
  { value: 'Cliente', label: 'Cliente Ativo' }
];

const LOSS_REASONS = [
  'Preço / Orçamento fora do perfil',
  'Optou por concorrente',
  'Sem demanda no momento',
  'Telefone ou contato desatualizado',
  'Não respondeu às tentativas',
  'Outro motivo'
];

function getInitials(name) {
  if (!name) return 'EM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function BusinessDetails({
  isOpen,
  place,
  onClose,
  isFavorite = false,
  onToggleFavorite,
  onAddToList,
  onOpenRadar,
  leadData = {},
  onUpdateLead,
  onAddActivity
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'digital' | 'crm'
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState(null);
  const [isEnriching, setIsEnriching] = useState(false);

  // Form states
  const [status, setStatus] = useState('Novo');
  const [nextAction, setNextAction] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [lossReason, setLossReason] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [newActivityInput, setNewActivityInput] = useState('');

  // Manual social edit
  const [manualPlatform, setManualPlatform] = useState('instagram');
  const [manualUrl, setManualUrl] = useState('');
  const [showAddManual, setShowAddManual] = useState(false);

  useEffect(() => {
    if (place) {
      setStatus(leadData.status || 'Novo');
      setNextAction(leadData.nextAction || '');
      setReturnDate(leadData.returnDate || '');
      setLossReason(leadData.lossReason || '');
      setNotes(leadData.notes || '');
      setTags(leadData.tags || []);
    }
  }, [place, leadData]);

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
  const dp = {
    ...(place.socials || {}),
    ...(place.digitalPresence || {}),
    ...(leadData.digitalPresence || {})
  };
  const scoreData = calculateLeadScore(place, leadData);

  const saveUpdates = (updates) => {
    setSaveIndicator('saving');
    onUpdateLead(placeId, updates, place);
    setTimeout(() => {
      setSaveIndicator('saved');
      setTimeout(() => setSaveIndicator(null), 1800);
    }, 200);
  };

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

  const handleSingleEnrich = async () => {
    setIsEnriching(true);
    try {
      const res = await enrichmentService.enrichLead(place);
      if (res.channels) {
        saveUpdates({ digitalPresence: res.channels });
      }
    } catch (err) {
      console.warn('Enrichment failed:', err);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleAddManualLink = () => {
    if (!manualUrl.trim()) return;
    const currentDP = { ...dp };
    currentDP[manualPlatform] = {
      platform: manualPlatform,
      url: manualUrl.trim(),
      handle: manualUrl.trim(),
      source: 'Informado pelo usuário',
      status: 'Confirmado pelo usuário',
      discoveredAt: new Date().toISOString()
    };
    saveUpdates({ digitalPresence: currentDP });
    setManualUrl('');
    setShowAddManual(false);
  };

  const handleConfirmChannel = (platformKey) => {
    const currentDP = { ...dp };
    if (currentDP[platformKey]) {
      currentDP[platformKey] = {
        ...currentDP[platformKey],
        status: 'Confirmado pelo usuário',
        verifiedAt: new Date().toISOString()
      };
      saveUpdates({ digitalPresence: currentDP });
    }
  };

  const handleAddActivitySubmit = (e) => {
    e.preventDefault();
    if (!newActivityInput.trim()) return;
    onAddActivity(placeId, newActivityInput.trim(), 'interaction');
    setNewActivityInput('');
  };

  const handleAddTag = (tagToAdd) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    const updated = [...tags, trimmed];
    setTags(updated);
    saveUpdates({ tags: updated });
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    const updated = tags.filter(t => t !== tagToRemove);
    setTags(updated);
    saveUpdates({ tags: updated });
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="business-details-drawer open" aria-label="Ficha Comercial Completa">
        {/* Drawer Header */}
        <div className="modal-header" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
            <div className="company-avatar" style={{ width: '44px', height: '44px', fontSize: '15px', background: 'var(--brand-primary)', color: '#FFFFFF' }}>
              {getInitials(name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '17px', fontWeight: '800', lineHeight: '1.25', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span className="badge badge-neutral">{getCategoryLabel(category)}</span>
                <span className="badge badge-brand tnum">Score {scoreData.totalScore}/100</span>
                {saveIndicator && (
                  <span style={{ fontSize: '11.5px', color: 'var(--color-success)', fontWeight: '700' }}>
                    {saveIndicator === 'saving' ? 'Salvando...' : '✓ Salvo'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn-icon"
              onClick={() => onToggleFavorite(place)}
              title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              style={{ color: isFavorite ? 'var(--color-warning)' : 'var(--text-muted)' }}
            >
              <Bookmark size={18} fill={isFavorite ? 'var(--color-warning)' : 'none'} />
            </button>
            <button className="btn-icon" onClick={onClose} aria-label="Fechar ficha">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div style={{ padding: '12px 24px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {phone && (
            <a href={`tel:${phone}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <Phone size={13} color="var(--brand-primary)" />
              <span>Ligar</span>
            </a>
          )}
          {rawWeb && (
            <a href={rawWeb} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <Globe size={13} color="var(--brand-primary)" />
              <span>Website</span>
            </a>
          )}
          {dp.whatsapp?.url && (
            <a href={dp.whatsapp.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1, color: '#059669' }}>
              <MessageCircle size={13} color="#059669" />
              <span>WhatsApp</span>
            </a>
          )}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
            <Navigation size={13} color="var(--brand-primary)" />
            <span>Rotas</span>
          </a>
        </div>

        {/* 3 Structured Tabs Header */}
        <div className="drawer-tabs-header">
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Empresa
          </button>
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'digital' ? 'active' : ''}`}
            onClick={() => setActiveTab('digital')}
          >
            Presença Digital
          </button>
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'crm' ? 'active' : ''}`}
            onClick={() => setActiveTab('crm')}
          >
            Atividade & CRM
          </button>
        </div>

        {/* Drawer Tab Content Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          
          {/* TAB 1: EMPRESA */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Address & Phone */}
              <div className="detail-card-box">
                <div className="detail-section-title">Localização & Contato</div>
                
                {phone && (
                  <div className="detail-item-row">
                    <span className="detail-item-label">
                      <Phone size={14} /> Telefone Principal:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="detail-item-value">{formatPhone(phone)}</span>
                      <button className="btn-icon" onClick={handleCopyPhone} style={{ padding: '3px' }} title="Copiar telefone">
                        {copiedPhone ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="detail-item-label">
                      <MapPin size={14} /> Endereço Completo:
                    </span>
                    <button className="btn-icon" onClick={handleCopyAddress} style={{ padding: '3px' }} title="Copiar endereço">
                      {copiedAddress ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.45' }}>
                    {address}
                  </p>
                </div>

                {distance !== null && distance !== undefined && (
                  <div className="detail-item-row" style={{ paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="detail-item-label">Distância do centro de busca:</span>
                    <span className="detail-item-value tnum">{formatDistance(distance)}</span>
                  </div>
                )}
              </div>

              {/* Working Hours */}
              {hours.length > 0 && (
                <div className="detail-card-box">
                  <div className="detail-section-title">Horário de Funcionamento</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {hours.map((line, idx) => (
                      <div key={idx} style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onAddToList(place)}
                  style={{ flex: 1 }}
                >
                  <BookmarkPlus size={14} />
                  <span>Salvar na Lista</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onOpenRadar(place)}
                >
                  <RadarIcon size={14} />
                  <span>Radar de Concorrentes</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PRESENÇA DIGITAL */}
          {activeTab === 'digital' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  Canais e Redes Descobertos
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSingleEnrich}
                  disabled={isEnriching || !rawWeb}
                  title={rawWeb ? "Escanear website da empresa para encontrar canais sociais" : "Sem website cadastrado"}
                >
                  {isEnriching ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  <span>{isEnriching ? 'Rastreando...' : 'Rastrear Canais'}</span>
                </button>
              </div>

              <div className="detail-card-box">
                {/* Website */}
                <div className="detail-item-row">
                  <span className="detail-item-label">
                    <Globe size={14} color="var(--brand-primary)" /> Website Institucional
                  </span>
                  <div className="detail-item-value">
                    {rawWeb ? (
                      <a href={rawWeb} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                        {cleanDomain} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Sem website</span>
                    )}
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="detail-item-row">
                  <span className="detail-item-label">
                    <MessageCircle size={14} color="#059669" /> WhatsApp Comercial
                  </span>
                  <div className="detail-item-value">
                    {dp.whatsapp?.url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <a href={dp.whatsapp.url} target="_blank" rel="noopener noreferrer" style={{ color: '#059669', fontWeight: '700' }}>
                          {dp.whatsapp.handle || 'Conversar no WhatsApp'}
                        </a>
                        {dp.whatsapp.status !== 'Confirmado pelo usuário' && (
                          <button className="btn-ghost" style={{ padding: '2px 6px', fontSize: '11px' }} onClick={() => handleConfirmChannel('whatsapp')}>
                            ✓ Confirmar
                          </button>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>Não localizado</span>
                    )}
                  </div>
                </div>

                {/* Instagram */}
                <div className="detail-item-row">
                  <span className="detail-item-label">
                    <Instagram size={14} color="#D946EF" /> Instagram
                  </span>
                  <div className="detail-item-value">
                    {dp.instagram?.url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <a href={dp.instagram.url} target="_blank" rel="noopener noreferrer" style={{ color: '#D946EF', fontWeight: '700' }}>
                          {dp.instagram.handle || 'Abrir perfil'}
                        </a>
                        {dp.instagram.status !== 'Confirmado pelo usuário' && (
                          <button className="btn-ghost" style={{ padding: '2px 6px', fontSize: '11px' }} onClick={() => handleConfirmChannel('instagram')}>
                            ✓ Confirmar
                          </button>
                        )}
                      </div>
                    ) : (
                      <a
                        href={enrichmentService.getSearchUrlForPlatform(name, address, 'instagram')}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                      >
                        <Search size={12} /> Pesquisar perfil
                      </a>
                    )}
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="detail-item-row">
                  <span className="detail-item-label">
                    <Linkedin size={14} color="#0284C7" /> LinkedIn
                  </span>
                  <div className="detail-item-value">
                    {dp.linkedin?.url ? (
                      <a href={dp.linkedin.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0284C7', fontWeight: '700' }}>
                        {dp.linkedin.handle || 'Perfil Corporativo'}
                      </a>
                    ) : (
                      <a
                        href={enrichmentService.getSearchUrlForPlatform(name, address, 'linkedin')}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                      >
                        <Search size={12} /> Pesquisar perfil
                      </a>
                    )}
                  </div>
                </div>

                {/* Commercial Email */}
                <div className="detail-item-row">
                  <span className="detail-item-label">
                    <Mail size={14} /> E-mail Comercial
                  </span>
                  <div className="detail-item-value">
                    {dp.email?.address ? (
                      <a href={`mailto:${dp.email.address}`} style={{ fontWeight: '600' }}>
                        {dp.email.address}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>Não localizado</span>
                    )}
                  </div>
                </div>

                {/* Add Manual Channel */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                  {!showAddManual ? (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setShowAddManual(true)}
                      style={{ fontSize: '12px', padding: '4px 8px', color: 'var(--brand-primary)', fontWeight: '600' }}
                    >
                      + Adicionar rede ou canal manualmente
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <select
                        value={manualPlatform}
                        onChange={(e) => setManualPlatform(e.target.value)}
                        style={{ padding: '6px 8px', fontSize: '12px' }}
                      >
                        <option value="instagram">Instagram</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="facebook">Facebook</option>
                        <option value="tiktok">TikTok</option>
                        <option value="email">E-mail</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Cole a URL ou @perfil"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                      />

                      <button className="btn btn-primary btn-sm" onClick={handleAddManualLink}>
                        Salvar
                      </button>
                      <button className="btn-ghost btn-sm" onClick={() => setShowAddManual(false)}>
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATIVIDADE & CRM */}
          {activeTab === 'crm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Pipeline Status */}
              <div className="detail-card-box">
                <div className="detail-section-title">Status no Pipeline</div>
                <div className="detail-item-row">
                  <span className="detail-item-label">Etapa comercial:</span>
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      saveUpdates({ status: e.target.value });
                    }}
                    style={{ padding: '6px 12px', fontSize: '13px', fontWeight: '700' }}
                  >
                    {LEAD_STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {status === 'Sem interesse' && (
                  <div className="detail-item-row">
                    <span className="detail-item-label" style={{ color: 'var(--color-alert)' }}>Motivo da perda:</span>
                    <select
                      value={lossReason}
                      onChange={(e) => {
                        setLossReason(e.target.value);
                        saveUpdates({ lossReason: e.target.value });
                      }}
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                    >
                      <option value="">Selecione um motivo</option>
                      {LOSS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Next Action & Date */}
              <div className="detail-card-box">
                <div className="detail-section-title">Próxima Ação & Retorno</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Ex: Ligar para agendar demonstração"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    onBlur={() => saveUpdates({ nextAction })}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                  />
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => {
                      setReturnDate(e.target.value);
                      saveUpdates({ returnDate: e.target.value });
                    }}
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Commercial Notes */}
              <div className="detail-card-box">
                <div className="detail-section-title">Notas Comerciais (Auto-save)</div>
                <textarea
                  className="notes-textarea"
                  placeholder="Registre tomador de decisão, principais objeções, porte da empresa ou detalhes da proposta..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => saveUpdates({ notes })}
                  style={{ minHeight: '80px' }}
                />
              </div>

              {/* Tags */}
              <div className="detail-card-box">
                <div className="detail-section-title">Tags & Segmentações</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {tags.map(tag => (
                    <span key={tag} className="tag-pill">
                      {tag}
                      <span className="remove-tag-btn" onClick={() => handleRemoveTag(tag)}>×</span>
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <input
                    type="text"
                    placeholder="Adicionar nova tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(newTagInput);
                      }
                    }}
                    style={{ flex: 1, padding: '6px 10px', fontSize: '12.5px' }}
                  />
                  <button className="btn btn-secondary btn-sm" onClick={() => handleAddTag(newTagInput)}>
                    + Tag
                  </button>
                </div>
              </div>

              {/* Interaction Activity Log */}
              <div className="detail-card-box">
                <div className="detail-section-title">Histórico de Atividades</div>
                <form onSubmit={handleAddActivitySubmit} style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Registrar contato (ex: Ligação realizada, pediu proposta)"
                    value={newActivityInput}
                    onChange={(e) => setNewActivityInput(e.target.value)}
                    style={{ flex: 1, padding: '6px 10px', fontSize: '12.5px' }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={!newActivityInput.trim()}>
                    Registrar
                  </button>
                </form>

                {leadData.activityLog?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto', marginTop: '6px' }}>
                    {leadData.activityLog.map(act => (
                      <div key={act.id} style={{ fontSize: '12px', padding: '6px 10px', background: 'var(--bg-panel)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                          {new Date(act.timestamp).toLocaleDateString('pt-BR')} {new Date(act.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — 
                        </span>
                        <span style={{ color: 'var(--text-primary)', marginLeft: '4px' }}>{act.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </aside>
    </>
  );
}
