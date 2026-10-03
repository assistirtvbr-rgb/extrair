import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPinOff, 
  CheckSquare, 
  Square, 
  ExternalLink,
  Phone,
  Globe,
  Star,
  Bookmark,
  Radar as RadarIcon,
  Loader2,
  AlertTriangle,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import ResultRow from './ResultRow';
import DigitalPresenceBadge from './DigitalPresenceBadge';
import LeadScoreBadge from './LeadScoreBadge';
import { extractCleanDomain } from '../utils/domain';
import { formatPhone, getCategoryLabel } from '../utils/formatter';
import { formatDistance } from '../utils/distance';
import { calculateLeadScore } from '../utils/scoring';

export default function ResultsList({
  places = [],
  isLoading = false,
  isLoadingMore = false,
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
  viewMode = 'split', // 'split' | 'list' | 'map' | 'table'
  filters = {},
  leadStore = {},
  onOpenDetails
}) {
  const [internalFilter, setInternalFilter] = useState('');

  // Filter & sort loaded items locally
  const processedPlaces = useMemo(() => {
    let result = [...places];

    // Filter by internal search input
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

    // Apply active filters
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

    // Sorting
    const sort = filters.sortBy || 'distance';
    result.sort((a, b) => {
      const idA = a.id || a.place_id;
      const idB = b.id || b.place_id;
      const leadA = leadStore[idA] || {};
      const leadB = leadStore[idB] || {};

      if (sort === 'score') {
        const scoreA = calculateLeadScore(a, leadA).totalScore;
        const scoreB = calculateLeadScore(b, leadB).totalScore;
        return scoreB - scoreA;
      }
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
            <div className="skeleton-box" style={{ width: '55%', height: '15px' }} />
            <div className="skeleton-box" style={{ width: '80%', height: '12px' }} />
            <div className="skeleton-box" style={{ width: '45%', height: '11px' }} />
          </div>
        ))}
      </div>
    );
  }

  // API Error State
  if (apiError) {
    return (
      <div className="empty-state-container">
        <div className="empty-state-icon" style={{ background: 'var(--terracotta-subtle)', color: 'var(--terracotta)' }}>
          <AlertTriangle size={24} />
        </div>
        <h3 className="empty-state-title" style={{ color: 'var(--terracotta)' }}>Erro na Consulta da API</h3>
        <p className="empty-state-desc">
          {apiError.message}
          {apiError.hint && (
            <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: 'var(--text-primary)' }}>
              💡 <strong>Dica:</strong> {apiError.hint}
            </span>
          )}
        </p>
      </div>
    );
  }

  // Empty Results State
  if (places.length === 0) {
    return (
      <div className="empty-state-container">
        <div className="empty-state-icon">
          <MapPinOff size={24} />
        </div>
        <h3 className="empty-state-title">Nenhum estabelecimento encontrado</h3>
        <p className="empty-state-desc">
          Não encontramos resultados para esta busca dentro do raio solicitado.
          <br />
          <strong>Sugestão:</strong> Aumente o raio de pesquisa ou experimente termos mais amplos (ex: <em>"odontologia"</em> ou <em>"academia"</em>).
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* List Toolbar */}
      <div className="results-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            type="button" 
            onClick={handleSelectAll} 
            className="btn-ghost" 
            style={{ padding: '2px', display: 'flex', alignItems: 'center' }}
            title={isAllSelected ? "Desmarcar todos" : "Selecionar todos os resultados"}
          >
            {isAllSelected ? <CheckSquare size={16} color="var(--green-dark)" /> : <Square size={16} />}
          </button>
          <span style={{ fontSize: '12.5px', fontWeight: '600' }} className="tnum">
            {processedPlaces.length} {processedPlaces.length === 1 ? 'empresa' : 'empresas'}
          </span>
        </div>

        <div className="results-filter-inline" style={{ width: '180px' }}>
          <Search size={13} className="search-icon" />
          <input
            type="text"
            placeholder="Filtrar resultados..."
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

          {/* Real Pagination "Carregar Mais" button */}
          {hasNextPage && (
            <div style={{ padding: '14px 18px', textAlign: 'center', background: 'var(--bg-main)' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                style={{ width: '100%' }}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Carregando próxima página do Google Places...
                  </>
                ) : (
                  <>
                    Carregar mais estabelecimentos da região
                  </>
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
                <th style={{ width: '30px' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Empresa</th>
                <th>Score</th>
                <th>Categoria</th>
                <th>Presença Digital / Redes</th>
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
                      />
                    </td>
                    <td style={{ fontWeight: '600' }}>{name}</td>
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                          <Star size={11} style={{ color: '#EAB308', fill: '#EAB308' }} />
                          <span className="tnum">{place.rating}</span> ({place.userRatingCount || 0})
                        </span>
                      ) : '—'}
                    </td>
                    <td className="tnum">{formatDistance(place.distanceKm)}</td>
                    <td>
                      <span className="badge badge-green">{leadData.status || 'Novo'}</span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn-icon"
                          onClick={() => onToggleFavorite(place)}
                          style={{ color: isFav(placeId) ? '#EAB308' : 'var(--text-muted)' }}
                        >
                          <Bookmark size={14} fill={isFav(placeId) ? '#EAB308' : 'none'} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => onOpenRadar(place)}
                          title="Radar de concorrentes"
                        >
                          <RadarIcon size={14} />
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
