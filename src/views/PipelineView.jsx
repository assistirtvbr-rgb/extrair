import React, { useState } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Calendar, 
  Phone, 
  MessageCircle, 
  AlertCircle, 
  CheckCircle, 
  Search, 
  SlidersHorizontal,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import LeadScoreBadge from '../components/LeadScoreBadge';
import { formatPhone, getCategoryLabel } from '../utils/formatter';

const STAGES = [
  { key: 'Novo', label: 'Novo Lead', color: '#616963' },
  { key: 'Pesquisar', label: 'Pesquisar', color: '#2B617E' },
  { key: 'Contato futuro', label: 'Contato Futuro', color: '#8F6013' },
  { key: 'Contato realizado', label: 'Contato Realizado', color: '#20539E' },
  { key: 'Interessado', label: 'Interessado', color: '#173F35' },
  { key: 'Sem interesse', label: 'Sem Interesse', color: '#A13333' },
  { key: 'Cliente', label: 'Cliente', color: '#2E6B34' }
];

export default function PipelineView({
  leadStore = {},
  onUpdateLead,
  onOpenDetails
}) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'TODAY' | 'OVERDUE' | 'NO_ACTION' | 'INTERESTED' | 'UNCONTACTED'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="results-filter-inline" style={{ width: '220px' }}>
            <Search size={13} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar no pipeline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Quick Filters */}
          <div className="radius-selector">
            <button
              className={`radius-chip ${filterType === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterType('ALL')}
            >
              Todos ({allLeadsList.length})
            </button>
            <button
              className={`radius-chip ${filterType === 'TODAY' ? 'active' : ''}`}
              onClick={() => setFilterType('TODAY')}
            >
              Retornos de Hoje
            </button>
            <button
              className={`radius-chip ${filterType === 'OVERDUE' ? 'active' : ''}`}
              onClick={() => setFilterType('OVERDUE')}
              style={{ color: filterType === 'OVERDUE' ? 'var(--terracotta)' : undefined }}
            >
              Atrasados
            </button>
            <button
              className={`radius-chip ${filterType === 'NO_ACTION' ? 'active' : ''}`}
              onClick={() => setFilterType('NO_ACTION')}
            >
              Sem Próxima Ação
            </button>
            <button
              className={`radius-chip ${filterType === 'INTERESTED' ? 'active' : ''}`}
              onClick={() => setFilterType('INTERESTED')}
            >
              Interessados
            </button>
          </div>
        </div>

        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Arraste os cards entre as colunas ou use o menu da ficha comercial.
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
              <div className="kanban-col-header" style={{ borderTop: `3px solid ${stage.color}` }}>
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
                        <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.3' }}>
                          {name}
                        </span>
                        <LeadScoreBadge place={{ ...place, digitalPresence: dp }} leadData={lead} />
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {getCategoryLabel(category)}
                      </div>

                      {/* Next Action reminder */}
                      {lead.nextAction && (
                        <div style={{ fontSize: '11px', color: isOverdue ? 'var(--terracotta)' : 'var(--green-dark)', background: isOverdue ? 'var(--terracotta-subtle)' : 'var(--green-subtle)', padding: '2px 5px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={11} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lead.nextAction} {lead.returnDate ? `(${lead.returnDate})` : ''}
                          </span>
                        </div>
                      )}

                      {/* Quick Contact buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {phone && (
                            <a
                              href={`tel:${phone}`}
                              className="btn-icon"
                              style={{ padding: '2px 4px', fontSize: '11px', color: 'var(--text-secondary)' }}
                              title={`Ligar: ${formatPhone(phone)}`}
                            >
                              <Phone size={11} />
                            </a>
                          )}
                          {dp.whatsapp?.url && (
                            <a
                              href={dp.whatsapp.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-icon"
                              style={{ padding: '2px 4px', fontSize: '11px', color: '#128C7E' }}
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle size={11} />
                            </a>
                          )}
                        </div>

                        {/* Accessible Move Stage Selector */}
                        <select
                          value={lead.status || 'Novo'}
                          onChange={(e) => onUpdateLead(placeId, { status: e.target.value })}
                          style={{ fontSize: '10.5px', padding: '1px 4px' }}
                        >
                          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}

                {stageLeads.length === 0 && (
                  <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    Arraste leads para cá
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
