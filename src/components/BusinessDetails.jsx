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
  Sparkles,
  MessageCircle,
  Instagram,
  Linkedin,
  Facebook,
  Mail,
  Calendar,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2
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
  'Preço / Orçamento',
  'Optou por concorrente',
  'Sem demanda atual',
  'Telefone / Contato inválido',
  'Não respondeu às tentativas',
  'Outro motivo'
];

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
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState(null);
  const [isEnriching, setIsEnriching] = useState(false);

  // Form states
  const [status, setStatus] = useState('Novo');
  const [nextAction, setNextAction] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [priority, setPriority] = useState('Média');
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
      setPriority(leadData.priority || 'Média');
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
  const hours = place.currentOpeningHours?.weekdayDescriptions || [];
  const isOpenNow = place.currentOpeningHours?.openNow;

  const dp = place.digitalPresence || leadData.digitalPresence || {};
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
      <aside className="business-details-drawer open" aria-label="Ficha Comercial">
        {/* Drawer Header */}
        <div className="modal-header">
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
              <span className="badge badge-neutral">{getCategoryLabel(category)}</span>
              <span className="badge badge-lime tnum">Score {scoreData.totalScore}/100</span>
              {saveIndicator && (
                <span style={{ fontSize: '11px', color: 'var(--green-dark)', fontWeight: '600' }}>
                  {saveIndicator === 'saving' ? 'Salvando...' : '✓ Salvo'}
                </span>
              )}
            </div>
          </div>

          <button className="btn-icon" onClick={onClose} aria-label="Fechar ficha">
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          
          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => onAddToList(place)}
              style={{ flex: 1 }}
            >
              <BookmarkPlus size={13} />
              Adicionar à lista
            </button>

            <button
              className={`btn btn-secondary btn-sm ${isFavorite ? 'active' : ''}`}
              onClick={() => onToggleFavorite(place)}
            >
              <Bookmark size={13} fill={isFavorite ? '#EAB308' : 'none'} color={isFavorite ? '#EAB308' : 'currentColor'} />
              {isFavorite ? 'Favorito' : 'Favoritar'}
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenRadar(place)}
              title="Buscar concorrentes próximos"
            >
              <RadarIcon size={13} />
              Radar
            </button>
          </div>

          {/* SECTION 1: PRESENÇA DIGITAL E CANAIS */}
          <div className="detail-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="detail-section-title">Presença Digital & Redes Sociais</label>
              <button
                className="btn btn-lime btn-sm"
                onClick={handleSingleEnrich}
                disabled={isEnriching || !rawWeb}
                style={{ padding: '2px 7px', fontSize: '11px' }}
                title={rawWeb ? "Escanear website da empresa para encontrar canais sociais" : "Empresa sem website cadastrado"}
              >
                {isEnriching ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {isEnriching ? 'Rastreando...' : 'Rastrear Canais'}
              </button>
            </div>

            <div className="detail-card-box">
              {/* Website */}
              <div className="detail-item-row">
                <span className="detail-item-label">
                  <Globe size={13} /> Website Institucional
                </span>
                <div className="detail-item-value">
                  {rawWeb ? (
                    <a href={rawWeb} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                      {cleanDomain} <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Sem website</span>
                  )}
                </div>
              </div>

              {/* WhatsApp */}
              <div className="detail-item-row">
                <span className="detail-item-label">
                  <MessageCircle size={13} color="#128C7E" /> WhatsApp Comercial
                </span>
                <div className="detail-item-value">
                  {dp.whatsapp?.url ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <a href={dp.whatsapp.url} target="_blank" rel="noopener noreferrer" style={{ color: '#128C7E', fontWeight: '600' }}>
                        {dp.whatsapp.handle || 'Conversar'}
                      </a>
                      {dp.whatsapp.status !== 'Confirmado pelo usuário' && (
                        <button className="btn-ghost" style={{ padding: '1px 4px', fontSize: '10px' }} onClick={() => handleConfirmChannel('whatsapp')}>
                          ✓ Confirmar
                        </button>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Não localizado</span>
                  )}
                </div>
              </div>

              {/* Instagram */}
              <div className="detail-item-row">
                <span className="detail-item-label">
                  <Instagram size={13} color="#C13584" /> Instagram
                </span>
                <div className="detail-item-value">
                  {dp.instagram?.url ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <a href={dp.instagram.url} target="_blank" rel="noopener noreferrer" style={{ color: '#C13584', fontWeight: '600' }}>
                        {dp.instagram.handle || 'Abrir perfil'}
                      </a>
                      {dp.instagram.status !== 'Confirmado pelo usuário' && (
                        <button className="btn-ghost" style={{ padding: '1px 4px', fontSize: '10px' }} onClick={() => handleConfirmChannel('instagram')}>
                          ✓ Confirmar
                        </button>
                      )}
                    </div>
                  ) : (
                    <a
                      href={enrichmentService.getSearchUrlForPlatform(name, address, 'instagram')}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', color: 'var(--text-secondary)' }}
                    >
                      <Search size={11} /> Pesquisar perfil
                    </a>
                  )}
                </div>
              </div>

              {/* LinkedIn */}
              <div className="detail-item-row">
                <span className="detail-item-label">
                  <Linkedin size={13} color="#0A66C2" /> LinkedIn
                </span>
                <div className="detail-item-value">
                  {dp.linkedin?.url ? (
                    <a href={dp.linkedin.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0A66C2', fontWeight: '600' }}>
                      {dp.linkedin.handle || 'Perfil da Empresa'}
                    </a>
                  ) : (
                    <a
                      href={enrichmentService.getSearchUrlForPlatform(name, address, 'linkedin')}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', color: 'var(--text-secondary)' }}
                    >
                      <Search size={11} /> Pesquisar perfil
                    </a>
                  )}
                </div>
              </div>

              {/* Commercial Email */}
              <div className="detail-item-row">
                <span className="detail-item-label">
                  <Mail size={13} /> E-mail Comercial
                </span>
                <div className="detail-item-value">
                  {dp.email?.address ? (
                    <a href={`mailto:${dp.email.address}`} style={{ fontWeight: '500' }}>
                      {dp.email.address}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Não localizado</span>
                  )}
                </div>
              </div>

              {/* Add Manual Link */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                {!showAddManual ? (
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => setShowAddManual(true)}
                    style={{ fontSize: '11px', padding: '2px 4px', color: 'var(--green-dark)' }}
                  >
                    + Adicionar canal ou rede manualmente
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <select
                      value={manualPlatform}
                      onChange={(e) => setManualPlatform(e.target.value)}
                      style={{ padding: '3px 6px', fontSize: '11px' }}
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
                      placeholder="Cole o link ou @perfil"
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      style={{ flex: 1, padding: '3px 6px', fontSize: '11px' }}
                    />

                    <button className="btn btn-primary btn-sm" onClick={handleAddManualLink} style={{ padding: '3px 8px' }}>
                      Salvar
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowAddManual(false)} style={{ padding: '3px' }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: QUALIFICAÇÃO COMERCIAL & PIPELINE (CRM) */}
          <div className="detail-section">
            <label className="detail-section-title">Acompanhamento & Pipeline Comercial</label>
            <div className="detail-card-box">
              {/* Status */}
              <div className="detail-item-row">
                <span className="detail-item-label">Status do Lead:</span>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    saveUpdates({ status: e.target.value });
                  }}
                  style={{ padding: '4px 8px', fontSize: '12px', fontWeight: '600' }}
                >
                  {LEAD_STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Loss reason if Sem interesse */}
              {status === 'Sem interesse' && (
                <div className="detail-item-row">
                  <span className="detail-item-label" style={{ color: 'var(--terracotta)' }}>Motivo de perda:</span>
                  <select
                    value={lossReason}
                    onChange={(e) => {
                      setLossReason(e.target.value);
                      saveUpdates({ lossReason: e.target.value });
                    }}
                    style={{ padding: '3px 6px', fontSize: '11.5px' }}
                  >
                    <option value="">Selecione um motivo</option>
                    {LOSS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}

              {/* Next Action & Return Date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px' }}>
                <span className="detail-item-label" style={{ fontSize: '12px' }}>
                  <Calendar size={13} /> Próxima Ação & Retorno
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Ex: Enviar proposta por WhatsApp"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    onBlur={() => saveUpdates({ nextAction })}
                    style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}
                  />
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => {
                      setReturnDate(e.target.value);
                      saveUpdates({ returnDate: e.target.value });
                    }}
                    style={{ padding: '4px 6px', fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="detail-item-label" style={{ fontSize: '12px' }}>
                    <TagIcon size={12} /> Tags comerciais:
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {tags.map(tag => (
                    <span key={tag} className="tag-pill">
                      {tag}
                      <span className="remove-tag-btn" onClick={() => handleRemoveTag(tag)}>×</span>
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  <input
                    type="text"
                    placeholder="Nova tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(newTagInput);
                      }
                    }}
                    style={{ flex: 1, padding: '3px 6px', fontSize: '11.5px' }}
                  />
                  <button className="btn btn-secondary btn-sm" onClick={() => handleAddTag(newTagInput)}>
                    + Tag
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: ATIVIDADES & NOTAS COMERCIAIS */}
          <div className="detail-section">
            <label className="detail-section-title">Notas & Histórico de Interações</label>
            <div className="detail-card-box">
              <textarea
                className="notes-textarea"
                placeholder="Anotações comerciais sobre tomador de decisão, objeções ou propostas..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => saveUpdates({ notes })}
                style={{ minHeight: '60px' }}
              />

              {/* Activity Log */}
              <form onSubmit={handleAddActivitySubmit} style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="text"
                  placeholder="Registrar contato (ex: Ligação realizada - sem resposta)"
                  value={newActivityInput}
                  onChange={(e) => setNewActivityInput(e.target.value)}
                  style={{ flex: 1, padding: '4px 6px', fontSize: '11.5px' }}
                />
                <button type="submit" className="btn btn-secondary btn-sm" disabled={!newActivityInput.trim()}>
                  Registrar
                </button>
              </form>

              {leadData.activityLog?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
                  {leadData.activityLog.map(act => (
                    <div key={act.id} style={{ fontSize: '11px', padding: '3px 6px', background: 'var(--bg-panel)', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(act.timestamp).toLocaleDateString('pt-BR')} {new Date(act.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — </span>
                      <span>{act.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: CONTATO, LOCALIZAÇÃO & GOOGLE MAPS */}
          <div className="detail-section">
            <label className="detail-section-title">Contato & Endereço</label>
            <div className="detail-card-box">
              {phone && (
                <div className="detail-item-row">
                  <span className="detail-item-label">
                    <Phone size={13} /> Telefone
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="detail-item-value">{formatPhone(phone)}</span>
                    <button className="btn-icon" onClick={handleCopyPhone} style={{ padding: '2px' }}>
                      {copiedPhone ? <Check size={13} color="var(--green-dark)" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="detail-item-label">
                    <MapPin size={13} /> Endereço
                  </span>
                  <button className="btn-icon" onClick={handleCopyAddress} style={{ padding: '2px' }}>
                    {copiedAddress ? <Check size={13} color="var(--green-dark)" /> : <Copy size={13} />}
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  {address}
                </p>
              </div>

              <div className="detail-item-row" style={{ paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
                <span className="detail-item-label">Rota no Google Maps:</span>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '2px 7px' }}
                >
                  Abrir Mapa <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>

          {/* Hours */}
          {hours.length > 0 && (
            <div className="detail-section">
              <label className="detail-section-title">Horário de Funcionamento</label>
              <div className="detail-card-box" style={{ gap: '4px' }}>
                {hours.map((line, idx) => (
                  <div key={idx} style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </aside>
    </>
  );
}
