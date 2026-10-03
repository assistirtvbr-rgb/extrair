import React, { useState } from 'react';
import { Bookmark, Search, Download, Trash2, Globe, Phone, Star, MapPin } from 'lucide-react';
import { extractCleanDomain } from '../utils/domain';
import { formatPhone, getCategoryLabel, formatDate } from '../utils/formatter';
import { formatDistance } from '../utils/distance';
import { exportToCSV, exportToJSON } from '../utils/csv';

export default function FavoritesView({
  favorites = [],
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
      <div style={{ padding: '16px 24px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="results-filter-inline" style={{ width: '260px' }}>
            <Search size={13} className="search-icon" />
            <input
              type="text"
              placeholder="Pesquisar nos favoritos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {filtered.length} {filtered.length === 1 ? 'empresa favoritada' : 'empresas favoritadas'}
          </span>
        </div>

        {favorites.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <Download size={14} />
            Exportar Favoritos (CSV)
          </button>
        )}
      </div>

      {/* Content */}
      <div className="table-container">
        {filtered.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-state-icon">
              <Bookmark size={26} />
            </div>
            <h3 className="empty-state-title">Nenhum favorito encontrado</h3>
            <p className="empty-state-desc">
              Você pode marcar qualquer estabelecimento com estrela durante as pesquisas para salvar como favorito.
            </p>
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
                <th>Endereço</th>
                <th>Data Salva</th>
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
                const cleanDomain = extractCleanDomain(rawWeb);
                const address = place.formattedAddress || place.address;

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
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={address}>
                      {address}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {formatDate(place.savedAt)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-icon"
                        onClick={() => onToggleFavorite(place)}
                        title="Remover dos favoritos"
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
    </div>
  );
}
