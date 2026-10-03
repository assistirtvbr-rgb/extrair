import React, { useState } from 'react';
import { Bookmark, Search, Download, Trash2, Star } from 'lucide-react';
import DigitalPresenceBadge from '../components/DigitalPresenceBadge';
import LeadScoreBadge from '../components/LeadScoreBadge';
import { formatPhone, getCategoryLabel } from '../utils/formatter';
import { exportToCSV } from '../utils/csv';

export default function FavoritesView({
  favorites = [],
  leadStore = {},
  onToggleFavorite,
  onOpenDetails,
  onAddToList
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = favorites.filter(p => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = (p.displayName?.text || p.name || '').toLowerCase();
    const address = (p.formattedAddress || p.address || '').toLowerCase();
    const category = (p.primaryTypeDisplayName?.text || p.category || '').toLowerCase();
    return name.includes(term) || address.includes(term) || category.includes(term);
  });

  const handleExport = () => {
    if (favorites.length === 0) return;
    exportToCSV(favorites, {}, 'leadmap-favoritos.csv');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'var(--bg-main)' }}>
      {/* Top Toolbar */}
      <div style={{ padding: '14px 24px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="results-filter-inline" style={{ width: '260px' }}>
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Pesquisar nos favoritos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="tnum">
            {filtered.length} {filtered.length === 1 ? 'empresa favoritada' : 'empresas favoritadas'}
          </span>
        </div>

        {favorites.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <Download size={14} />
            <span>Exportar Favoritos (CSV)</span>
          </button>
        )}
      </div>

      {/* Content Table */}
      <div className="table-container">
        {filtered.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-state-icon">
              <Bookmark size={26} color="var(--color-warning)" />
            </div>
            <h3 className="empty-state-title">Nenhum lead favorito</h3>
            <p className="empty-state-desc">
              Clique no ícone de estrela nas buscas para salvar empresas para abordagem prioritária.
            </p>
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
                <th>Avaliação</th>
                <th>Endereço</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(place => {
                const placeId = place.id || place.place_id;
                const name = place.displayName?.text || place.name;
                const category = place.primaryTypeDisplayName?.text || place.category;
                const phone = place.nationalPhoneNumber || place.phone;
                const rawWeb = place.websiteUri || place.website;
                const address = place.formattedAddress || place.address;
                const leadData = leadStore[placeId] || {};
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
                    <td>
                      {place.rating ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                          <Star size={12} style={{ color: 'var(--color-warning)', fill: 'var(--color-warning)' }} />
                          <span className="tnum">{place.rating}</span> ({place.userRatingCount || 0})
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={address}>
                      {address}
                    </td>
                    <td>
                      <span className="badge badge-brand">{leadData.status || 'Novo'}</span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => onToggleFavorite(place)}
                        title="Remover dos favoritos"
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
    </div>
  );
}
