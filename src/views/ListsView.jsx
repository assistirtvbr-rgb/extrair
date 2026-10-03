import React, { useState } from 'react';
import { 
  BookmarkPlus, 
  Trash2, 
  Download, 
  Search, 
  ExternalLink, 
  Phone, 
  Globe, 
  Star, 
  FolderPlus,
  FolderOpen,
  Tag,
  ArrowLeft
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { extractCleanDomain } from '../utils/domain';
import { formatPhone, getCategoryLabel, formatDate } from '../utils/formatter';
import { exportToCSV, exportToJSON } from '../utils/csv';

export default function ListsView({
  onOpenDetails,
  leadMetadata,
  onUpdateLeadMeta
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
    const meta = leadMetadata[placeId] || { status: 'Novo' };
    
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
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700' }}>Listas de Prospecção</h2>
          <span className="badge badge-neutral">{lists.length}</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {lists.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Nenhuma lista salva ainda. Faça uma pesquisa e clique em <strong>Salvar lista</strong>.
            </div>
          ) : (
            lists.map(list => {
              const isSelected = list.id === activeListId;
              return (
                <div
                  key={list.id}
                  onClick={() => setActiveListId(list.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--green-subtle)' : 'transparent',
                    border: isSelected ? '1px solid var(--green-light)' : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: isSelected ? '700' : '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {list.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {list.places?.length || 0} empresas • {formatDate(list.createdAt)}
                    </div>
                  </div>

                  <button
                    className="btn-icon"
                    onClick={(e) => handleDeleteList(list.id, e)}
                    title="Excluir lista"
                    style={{ padding: '4px' }}
                  >
                    <Trash2 size={13} color="var(--alert-color)" />
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
                <h2 style={{ fontSize: '16px', fontWeight: '700' }}>{activeList.name}</h2>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Criada em {formatDate(activeList.createdAt)} • {activeList.places?.length || 0} estabelecimentos
                </span>
              </div>

              <button className="btn btn-secondary btn-sm" onClick={handleExportListCSV}>
                <Download size={14} />
                Exportar lista (CSV)
              </button>
            </div>

            {/* Sub-toolbar: Search & Status Filter */}
            <div style={{ padding: '10px 24px', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="results-filter-inline" style={{ width: '220px' }}>
                <Search size={13} className="search-icon" />
                <input
                  type="text"
                  placeholder="Pesquisar nesta lista..."
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: '4px 8px', fontSize: '12px' }}
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
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Nenhum estabelecimento encontrado nesta lista com os filtros aplicados.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Categoria</th>
                      <th>Telefone</th>
                      <th>Website</th>
                      <th>Avaliação</th>
                      <th>Status Lead (CRM)</th>
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
                      const cleanDomain = extractCleanDomain(rawWeb);
                      const meta = leadMetadata[placeId] || { status: 'Novo' };

                      return (
                        <tr key={placeId} onClick={() => onOpenDetails(place)} style={{ cursor: 'pointer' }}>
                          <td style={{ fontWeight: '600' }}>{name}</td>
                          <td>
                            <span className="badge badge-neutral">{getCategoryLabel(category)}</span>
                          </td>
                          <td>{phone ? formatPhone(phone) : '—'}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            {cleanDomain ? (
                              <a href={rawWeb} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Globe size={12} /> {cleanDomain}
                              </a>
                            ) : '—'}
                          </td>
                          <td>
                            {place.rating ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                                <Star size={12} className="result-rating-star" />
                                {place.rating} ({place.userRatingCount || 0})
                              </span>
                            ) : '—'}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <select
                              value={meta.status || 'Novo'}
                              onChange={(e) => onUpdateLeadMeta(placeId, { ...meta, status: e.target.value })}
                              style={{ fontSize: '11px', padding: '2px 6px', borderRadius: 'var(--radius-xs)' }}
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
                              <Trash2 size={13} color="var(--alert-color)" />
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
              Crie uma lista na tela de pesquisa de empresas ou selecione uma lista na barra lateral.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
