import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPinOff, 
  CheckSquare, 
  Square, 
  Bookmark, 
  Radar as RadarIcon, 
  Loader2, 
  AlertTriangle,
  Star
} from 'lucide-react';
import ResultRow from './ResultRow';
import DigitalPresenceBadge from './DigitalPresenceBadge';
import LeadScoreBadge from './LeadScoreBadge';
import { formatPhone, getCategoryLabel } from '../utils/formatter';
import { formatDistance } from '../utils/distance';

export default function ResultsList({
  places = [],
  isLoading = false,
  isLoadingMore = false,
  hasSearchedOnce = false,
  apiError = null,
  hasNextPage = false,
  onLoadMore,
  selectedPlaces = [],
  setSelectedPlaces,
  activePlace,
  setActivePlace,
  hoveredPlaceId,
  setHoveredPlaceId,
  favorites = [],
  onToggleFavorite,
  onOpenRadar,
  viewMode = 'split',
  filters = {},
  leadStore = {},
  onOpenDetails
}) {
  const [internalFilter, setInternalFilter] = useState('');

  // Local filter & sorting
  const processedPlaces = useMemo(() => {
    let result = [...places];

    if (internalFilter.trim()) {
      const term = internalFilter.toLowerCase().trim();
      result = result.filter(p => {
        const name = (p.displayName?.text || p.name || '').toLowerCase();
        const address = (p.formattedAddress || p.address || '').toLowerCase();
        const category = (p.primaryTypeDisplayName?.text || p.primaryType || p.category || '').toLowerCase();
        const phone = (p.nationalPhoneNumber || p.phone || '').toLowerCase();
        return name.includes(term) || address.includes(term) || category.includes(term) || phone.includes(term);
      });
    }

    if (filters.minRating > 0) {
      result = result.filter(p => p.rating && p.rating >= filters.minRating);
    }
    if (filters.minReviews > 0) {
      result = result.filter(p => (p.userRatingCount || 0) >= filters.minReviews);
    }
    if (filters.onlyWithPhone) {
      result = result.filter(p => Boolean(p.nationalPhoneNumber || p.internationalPhoneNumber || p.phone));
    }
    if (filters.onlyWithWebsite) {
      result = result.filter(p => Boolean(p.websiteUri || p.website));
    }
    if (filters.onlyWithInstagram) {
      result = result.filter(p => {
        const id = p.id || p.place_id;
        const lead = leadStore[id] || {};
        const dp = p.digitalPresence || lead.digitalPresence || {};
        return Boolean(dp.instagram?.url || dp.instagram?.handle);
      });
    }
    if (filters.onlyWithWhatsApp) {
      result = result.filter(p => {
        const id = p.id || p.place_id;
        const lead = leadStore[id] || {};
        const dp = p.digitalPresence || lead.digitalPresence || {};
        return Boolean(dp.whatsapp?.url || dp.whatsapp?.handle);
      });
    }
    if (filters.onlyOpenNow) {
      result = result.filter(p => p.currentOpeningHours?.openNow === true);
    }

    const sort = filters.sortBy || 'distance';
    result.sort((a, b) => {
      if (sort === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sort === 'reviews') {
        return (b.userRatingCount || 0) - (a.userRatingCount || 0);
      }
      if (sort === 'name') {
        const nameA = a.displayName?.text || a.name || '';
        const nameB = b.displayName?.text || b.name || '';
        return nameA.localeCompare(nameB);
      }
      return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
    });

    return result;
  }, [places, internalFilter, filters, leadStore]);

  const isAllSelected = processedPlaces.length > 0 && processedPlaces.every(p => {
    const id = p.id || p.place_id;
    return selectedPlaces.some(sp => (sp.id || sp.place_id) === id);
  });

  const handleSelectAll = () => {
    if (isAllSelected) {
      const visibleIds = new Set(processedPlaces.map(p => p.id || p.place_id));
      setSelectedPlaces(prev => prev.filter(p => !visibleIds.has(p.id || p.place_id)));
    } else {
      const selectedIds = new Set(selectedPlaces.map(p => p.id || p.place_id));
      const newSelections = [...selectedPlaces];
      for (const p of processedPlaces) {
        const id = p.id || p.place_id;
        if (!selectedIds.has(id)) {
          newSelections.push(p);
          selectedIds.add(id);
        }
      }
      setSelectedPlaces(newSelections);
    }
  };

  const handleToggleSelectOne = (place, checked) => {
    const id = place.id || place.place_id;
    if (checked) {
      if (!selectedPlaces.some(p => (p.id || p.place_id) === id)) {
        setSelectedPlaces([...selectedPlaces, place]);
      }
    } else {
      setSelectedPlaces(selectedPlaces.filter(p => (p.id || p.place_id) !== id));
    }
  };

  const isFav = (placeId) => favorites.some(f => (f.id || f.place_id) === placeId);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="results-scroll-container">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="skeleton-row">
            <div className="skeleton-box" style={{ width: '45%', height: '18px' }} />
            <div className="skeleton-box" style={{ width: '75%', height: '14px' }} />
            <div className="skeleton-box" style={{ width: '35%', height: '12px' }} />
          </div>
        ))}
      </div>
    );
  }

  // API Error State
  if (apiError) {
    return (
      <div className="empty-state-container">
        <div className="empty-state-icon" style={{ background: 'var(--color-alert-subtle)', color: 'var(--color-alert)' }}>
          <AlertTriangle size={26} />
        </div>
        <h3 className="empty-state-title" style={{ color: 'var(--color-alert)' }}>Erro na Busca</h3>
        <p className="empty-state-desc">
          {apiError.message}
          {apiError.hint && (
            <span style={{ display: 'block', marginTop: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
              💡 <strong>Dica:</strong> {apiError.hint}
            </span>
          )}
        </p>
      </div>
    );
  }

  // Initial State Before Any Search
  if (!hasSearchedOnce && places.length === 0) {
    return (
      <div className="empty-state-container">
        <div className="empty-state-icon" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}>
          <Search size={28} />
        </div>
        <h3 className="empty-state-title">Pronto para prospectar</h3>
        <p className="empty-state-desc">
          Digite o segmento de mercado (ex: <em>odontologia</em>, <em>padaria</em>, <em>farmácia</em>) e a localização acima, depois clique em <strong>Buscar Empresas</strong>.
        </p>
      </div>
    );
  }

  // Empty Results State After Search
  if (places.length === 0) {
    return (
      <div className="empty-state-container">
        <div className="empty-state-icon">
          <MapPinOff size={26} />
        </div>
        <h3 className="empty-state-title">Nenhum estabelecimento encontrado</h3>
        <p className="empty-state-desc">
          Não encontramos empresas para esta busca dentro do raio solicitado.
          <br />
          <strong>Sugestão:</strong> Ajuste o raio de pesquisa para uma distância maior ou utilize o botão GPS para refinar as coordenadas.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* List Toolbar */}
      <div className="results-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button" 
            onClick={handleSelectAll} 
            className="btn-ghost" 
            style={{ padding: '4px', display: 'flex', alignItems: 'center' }}
            title={isAllSelected ? "Desmarcar todos" : "Selecionar todos os resultados visíveis"}
          >
            {isAllSelected ? <CheckSquare size={18} color="var(--brand-primary)" /> : <Square size={18} color="var(--text-muted)" />}
          </button>
          <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' }} className="tnum">
            {processedPlaces.length} {processedPlaces.length === 1 ? 'empresa' : 'empresas'}
          </span>
        </div>

        <div className="results-filter-inline" style={{ width: '210px' }}>
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Filtrar por nome..."
            value={internalFilter}
            onChange={(e) => setInternalFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Directory List Mode (Split / List View) */}
      {viewMode !== 'table' ? (
        <div className="results-scroll-container">
          {processedPlaces.map((place) => {
            const placeId = place.id || place.place_id;
            const isSelected = selectedPlaces.some(p => (p.id || p.place_id) === placeId);
            const isActive = (activePlace && (activePlace.id || activePlace.place_id) === placeId) || hoveredPlaceId === placeId;
            const leadData = leadStore[placeId] || {};

            return (
              <ResultRow
                key={placeId}
                place={place}
                leadData={leadData}
                isSelected={isSelected}
                isActive={isActive}
                isFavorite={isFav(placeId)}
                onSelect={handleToggleSelectOne}
                onClick={() => onOpenDetails(place)}
                onMouseEnter={() => setHoveredPlaceId(placeId)}
                onMouseLeave={() => setHoveredPlaceId(null)}
                onToggleFavorite={onToggleFavorite}
                onOpenRadar={onOpenRadar}
              />
            );
          })}

          {/* Pagination Load More Button */}
          {hasNextPage && (
            <div style={{ padding: '16px 20px', textAlign: 'center', background: 'var(--bg-main)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                style={{ width: '100%', height: '42px', fontWeight: '600' }}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Carregando mais resultados...</span>
                  </>
                ) : (
                  <span>Carregar mais empresas da região</span>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Full Table Mode */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
                  />
                </th>
                <th>Empresa</th>
                <th>Score</th>
                <th>Categoria</th>
                <th>Presença Digital</th>
                <th>Telefone</th>
                <th>Avaliação</th>
                <th>Distância</th>
                <th>Status Pipeline</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {processedPlaces.map((place) => {
                const placeId = place.id || place.place_id;
                const isSelected = selectedPlaces.some(p => (p.id || p.place_id) === placeId);
                const isActive = (activePlace && (activePlace.id || activePlace.place_id) === placeId) || hoveredPlaceId === placeId;
                const name = place.displayName?.text || place.name;
                const category = place.primaryTypeDisplayName?.text || place.primaryType || place.category;
                const phone = place.nationalPhoneNumber || place.phone;
                const rawWeb = place.websiteUri || place.website;
                const leadData = leadStore[placeId] || {};
                const dp = place.digitalPresence || leadData.digitalPresence || {};

                return (
                  <tr 
                    key={placeId} 
                    className={`${isActive ? 'active' : ''}`}
                    onClick={() => onOpenDetails(place)}
                    onMouseEnter={() => setHoveredPlaceId(placeId)}
                    onMouseLeave={() => setHoveredPlaceId(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleToggleSelectOne(place, e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
                      />
                    </td>
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: '700' }}>
                          <Star size={12} style={{ color: 'var(--color-warning)', fill: 'var(--color-warning)' }} />
                          <span className="tnum">{place.rating}</span> ({place.userRatingCount || 0})
                        </span>
                      ) : '—'}
                    </td>
                    <td className="tnum">{formatDistance(place.distanceKm)}</td>
                    <td>
                      <span className="badge badge-brand">{leadData.status || 'Novo'}</span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => onToggleFavorite(place)}
                          style={{ color: isFav(placeId) ? 'var(--color-warning)' : 'var(--text-muted)' }}
                        >
                          <Bookmark size={15} fill={isFav(placeId) ? 'var(--color-warning)' : 'none'} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => onOpenRadar(place)}
                          title="Radar de concorrentes"
                        >
                          <RadarIcon size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
