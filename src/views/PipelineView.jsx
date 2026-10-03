import React, { useState } from 'react';
import { 
  Calendar, 
  Phone, 
  MessageCircle, 
  Search, 
  Sparkles
} from 'lucide-react';
import LeadScoreBadge from '../components/LeadScoreBadge';
import { formatPhone, getCategoryLabel } from '../utils/formatter';

const STAGES = [
  { key: 'Novo', label: 'Novo Lead', color: '#64748B' },
  { key: 'Pesquisar', label: 'Pesquisar', color: '#0284C7' },
  { key: 'Contato futuro', label: 'Contato Futuro', color: '#D97706' },
  { key: 'Contato realizado', label: 'Contato Realizado', color: '#5262F5' },
  { key: 'Interessado', label: 'Interessado', color: '#10B981' },
  { key: 'Sem interesse', label: 'Sem Interesse', color: '#E11D48' },
  { key: 'Cliente', label: 'Cliente Ativo', color: '#059669' }
];

export default function PipelineView({
  leadStore = {},
  onUpdateLead,
  onOpenDetails
}) {
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedPlaceId, setDraggedPlaceId] = useState(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Collect all leads with their cached data
  const allLeadsList = Object.values(leadStore).map(lead => {
    const place = lead.cachedData || {
      id: lead.placeId,
      displayName: { text: lead.placeId },
      name: lead.placeId
    };
    return {
      place,
      lead
    };
  });

  // Filter leads
  const filteredLeads = allLeadsList.filter(({ place, lead }) => {
    const name = (place.displayName?.text || place.name || '').toLowerCase();
    const category = (place.primaryTypeDisplayName?.text || place.category || '').toLowerCase();
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!name.includes(q) && !category.includes(q)) return false;
    }

    if (filterType === 'TODAY') {
      return lead.returnDate === todayStr;
    }
    if (filterType === 'OVERDUE') {
      return lead.returnDate && lead.returnDate < todayStr;
    }
    if (filterType === 'NO_ACTION') {
      return !lead.nextAction && lead.status !== 'Cliente' && lead.status !== 'Sem interesse';
    }
    if (filterType === 'INTERESTED') {
      return lead.status === 'Interessado';
    }
    if (filterType === 'UNCONTACTED') {
      return lead.status === 'Novo' || lead.status === 'Pesquisar';
    }

    return true;
  });

  // Drag handlers
  const handleDragStart = (e, placeId) => {
    setDraggedPlaceId(placeId);
    e.dataTransfer.setData('text/plain', placeId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const placeId = e.dataTransfer.getData('text/plain') || draggedPlaceId;
    if (placeId) {
      onUpdateLead(placeId, { status: targetStage });
      setDraggedPlaceId(null);
    }
  };

  return (
    <div className="pipeline-container">
      {/* Pipeline Toolbar */}
      <div className="pipeline-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="results-filter-inline" style={{ width: '240px' }}>
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar empresas no pipeline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Quick Filters */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-secondary btn-sm ${filterType === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterType('ALL')}
            >
              Todos ({allLeadsList.length})
            </button>
            <button
              type="button"
              className={`btn btn-secondary btn-sm ${filterType === 'TODAY' ? 'active' : ''}`}
              onClick={() => setFilterType('TODAY')}
            >
              Retornos Hoje
            </button>
            <button
              type="button"
              className={`btn btn-secondary btn-sm ${filterType === 'OVERDUE' ? 'active' : ''}`}
              onClick={() => setFilterType('OVERDUE')}
              style={{ color: filterType === 'OVERDUE' ? 'var(--color-alert)' : undefined }}
            >
              Atrasados
            </button>
            <button
              type="button"
              className={`btn btn-secondary btn-sm ${filterType === 'NO_ACTION' ? 'active' : ''}`}
              onClick={() => setFilterType('NO_ACTION')}
            >
              Sem Próxima Ação
            </button>
            <button
              type="button"
              className={`btn btn-secondary btn-sm ${filterType === 'INTERESTED' ? 'active' : ''}`}
              onClick={() => setFilterType('INTERESTED')}
            >
              Interessados
            </button>
          </div>
        </div>

        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Arraste os cards entre as colunas para atualizar a etapa comercial.
        </span>
      </div>

      {/* Kanban Board */}
      <div className="pipeline-board">
        {STAGES.map(stage => {
          const stageLeads = filteredLeads.filter(({ lead }) => (lead.status || 'Novo') === stage.key);

          return (
            <div
              key={stage.key}
              className="kanban-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              <div className="kanban-col-header" style={{ borderTop: `3.5px solid ${stage.color}` }}>
                <span style={{ color: stage.color }}>{stage.label}</span>
                <span className="badge badge-neutral tnum">{stageLeads.length}</span>
              </div>

              <div className="kanban-col-body">
                {stageLeads.map(({ place, lead }) => {
                  const placeId = place.id || place.place_id || lead.placeId;
                  const name = place.displayName?.text || place.name || 'Empresa';
                  const category = place.primaryTypeDisplayName?.text || place.category || 'Lead';
                  const phone = place.nationalPhoneNumber || place.phone;
                  const dp = place.digitalPresence || lead.digitalPresence || {};
                  const isOverdue = lead.returnDate && lead.returnDate < todayStr;

                  return (
                    <div
                      key={placeId}
                      className="kanban-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, placeId)}
                      onClick={() => onOpenDetails(place)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.3' }}>
                          {name}
                        </span>
                        <LeadScoreBadge place={{ ...place, digitalPresence: dp }} leadData={lead} />
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {getCategoryLabel(category)}
                      </div>

                      {/* Next Action reminder */}
                      {lead.nextAction && (
                        <div style={{ fontSize: '11.5px', color: isOverdue ? 'var(--color-alert)' : 'var(--brand-primary)', background: isOverdue ? 'var(--color-alert-subtle)' : 'var(--brand-subtle)', padding: '3px 6px', borderRadius: 'var(--radius-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lead.nextAction} {lead.returnDate ? `(${lead.returnDate})` : ''}
                          </span>
                        </div>
                      )}

                      {/* Quick Contact buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {phone && (
                            <a
                              href={`tel:${phone}`}
                              className="btn-icon"
                              style={{ padding: '3px 6px', fontSize: '12px', color: 'var(--text-secondary)' }}
                              title={`Ligar: ${formatPhone(phone)}`}
                            >
                              <Phone size={12} />
                            </a>
                          )}
                          {dp.whatsapp?.url && (
                            <a
                              href={dp.whatsapp.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-icon"
                              style={{ padding: '3px 6px', fontSize: '12px', color: '#059669' }}
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle size={12} />
                            </a>
                          )}
                        </div>

                        {/* Accessible Move Stage Selector */}
                        <select
                          value={lead.status || 'Novo'}
                          onChange={(e) => onUpdateLead(placeId, { status: e.target.value })}
                          style={{ fontSize: '11px', padding: '2px 6px' }}
                        >
                          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}

                {stageLeads.length === 0 && (
                  <div style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    Nenhum lead nesta etapa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
