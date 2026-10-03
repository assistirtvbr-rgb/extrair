import React, { useState } from 'react';
import { 
  Trash2, 
  Download, 
  Search, 
  FolderOpen
} from 'lucide-react';
import { storageService } from '../services/storageService';
import DigitalPresenceBadge from '../components/DigitalPresenceBadge';
import LeadScoreBadge from '../components/LeadScoreBadge';
import { formatPhone, getCategoryLabel, formatDate } from '../utils/formatter';
import { exportToCSV } from '../utils/csv';

export default function ListsView({
  onOpenDetails,
  leadStore = {},
  onUpdateLead
}) {
  const [lists, setLists] = useState(storageService.getLists());
  const [activeListId, setActiveListId] = useState(lists.length > 0 ? lists[0].id : null);
  const [listSearch, setListSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const reloadLists = () => {
    const updated = storageService.getLists();
    setLists(updated);
    if (updated.length > 0 && !updated.some(l => l.id === activeListId)) {
      setActiveListId(updated[0].id);
    }
  };

  const activeList = lists.find(l => l.id === activeListId);

  const handleDeleteList = (listId, e) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta lista?')) {
      storageService.deleteList(listId);
      reloadLists();
    }
  };

  const handleRemovePlaceFromList = (placeId, e) => {
    e.stopPropagation();
    if (activeListId) {
      storageService.removePlaceFromList(activeListId, placeId);
      reloadLists();
    }
  };

  const handleExportListCSV = () => {
    if (!activeList || !activeList.places?.length) return;
    exportToCSV(activeList.places, {}, `${activeList.name.toLowerCase().replace(/\s+/g, '-')}.csv`);
  };

  const filteredPlaces = (activeList?.places || []).filter(p => {
    const placeId = p.id || p.place_id;
    const meta = leadStore[placeId] || { status: 'Novo' };
    
    if (statusFilter !== 'ALL' && meta.status !== statusFilter) {
      return false;
    }

    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      const name = (p.displayName?.text || p.name || '').toLowerCase();
      const address = (p.formattedAddress || p.address || '').toLowerCase();
      return name.includes(q) || address.includes(q);
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: 'var(--bg-main)' }}>
      {/* Sidebar of lists */}
      <div style={{ width: '280px', borderRight: '1px solid var(--border-color)', background: 'var(--bg-panel)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '800' }}>Listas Salvas</h2>
          <span className="badge badge-brand tnum">{lists.length}</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {lists.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Nenhuma lista criada. Faça uma busca e clique em <strong>Salvar lista</strong>.
            </div>
          ) : (
            lists.map(list => {
              const isSelected = list.id === activeListId;
              return (
                <div
                  key={list.id}
                  onClick={() => setActiveListId(list.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--brand-subtle)' : 'transparent',
                    border: isSelected ? '1px solid var(--brand-border)' : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: isSelected ? '800' : '600', color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {list.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {list.places?.length || 0} empresas • {formatDate(list.createdAt)}
                    </div>
                  </div>

                  <button
                    className="btn-icon"
                    onClick={(e) => handleDeleteList(list.id, e)}
                    title="Excluir lista"
                    style={{ padding: '4px' }}
                  >
                    <Trash2 size={14} color="var(--color-alert)" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main List content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeList ? (
          <>
            {/* Header */}
            <div style={{ padding: '16px 24px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800' }}>{activeList.name}</h2>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Criada em {formatDate(activeList.createdAt)} • {activeList.places?.length || 0} estabelecimentos
                </span>
              </div>

              <button className="btn btn-secondary btn-sm" onClick={handleExportListCSV}>
                <Download size={14} />
                <span>Exportar CSV</span>
              </button>
            </div>

            {/* Sub-toolbar: Search & Status Filter */}
            <div style={{ padding: '10px 24px', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="results-filter-inline" style={{ width: '240px' }}>
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Pesquisar nesta lista..."
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: '4px 8px', fontSize: '12.5px' }}
                >
                  <option value="ALL">Todos os status</option>
                  <option value="Novo">Novo</option>
                  <option value="Pesquisar">Pesquisar</option>
                  <option value="Contato futuro">Contato futuro</option>
                  <option value="Contato realizado">Contato realizado</option>
                  <option value="Interessado">Interessado</option>
                  <option value="Sem interesse">Sem interesse</option>
                  <option value="Cliente">Cliente</option>
                </select>
              </div>
            </div>

            {/* Items Table */}
            <div className="table-container">
              {filteredPlaces.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Nenhum estabelecimento encontrado nesta lista com os filtros aplicados.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Score</th>
                      <th>Categoria</th>
                      <th>Presença Digital</th>
                      <th>Telefone</th>
                      <th>Status Pipeline</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlaces.map(place => {
                      const placeId = place.id || place.place_id;
                      const name = place.displayName?.text || place.name;
                      const category = place.primaryTypeDisplayName?.text || place.category;
                      const phone = place.nationalPhoneNumber || place.phone;
                      const rawWeb = place.websiteUri || place.website;
                      const leadData = leadStore[placeId] || { status: 'Novo' };
                      const dp = place.digitalPresence || leadData.digitalPresence || {};

                      return (
                        <tr key={placeId} onClick={() => onOpenDetails(place)} style={{ cursor: 'pointer' }}>
                          <td style={{ fontWeight: '700' }}>{name}</td>
                          <td>
                            <LeadScoreBadge place={{ ...place, digitalPresence: dp }} leadData={leadData} />
                          </td>
                          <td>
                            <span className="badge badge-neutral">{getCategoryLabel(category)}</span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <DigitalPresenceBadge digitalPresence={dp} websiteUrl={rawWeb} onOpenDetails={() => onOpenDetails(place)} />
                          </td>
                          <td>{phone ? formatPhone(phone) : '—'}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <select
                              value={leadData.status || 'Novo'}
                              onChange={(e) => onUpdateLead(placeId, { status: e.target.value })}
                              style={{ fontSize: '12px', padding: '3px 6px', borderRadius: 'var(--radius-xs)' }}
                            >
                              <option value="Novo">Novo</option>
                              <option value="Pesquisar">Pesquisar</option>
                              <option value="Contato futuro">Contato futuro</option>
                              <option value="Contato realizado">Contato realizado</option>
                              <option value="Interessado">Interessado</option>
                              <option value="Sem interesse">Sem interesse</option>
                              <option value="Cliente">Cliente</option>
                            </select>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button
                              className="btn-icon"
                              onClick={(e) => handleRemovePlaceFromList(placeId, e)}
                              title="Remover desta lista"
                            >
                              <Trash2 size={14} color="var(--color-alert)" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state-container">
            <div className="empty-state-icon">
              <FolderOpen size={26} />
            </div>
            <h3 className="empty-state-title">Nenhuma lista selecionada</h3>
            <p className="empty-state-desc">
              Crie uma lista na tela de pesquisa ou selecione uma lista no menu à esquerda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
