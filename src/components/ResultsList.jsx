import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  MapPinOff, 
  ChevronDown, 
  CheckSquare, 
  Square, 
  ExternalLink,
  Phone,
  Globe,
  Star,
  Bookmark,
  Radar as RadarIcon
} from 'lucide-react';
import ResultRow from './ResultRow';
import { extractCleanDomain } from '../utils/domain';
import { formatPhone, getCategoryLabel } from '../utils/formatter';
import { formatDistance } from '../utils/distance';

export default function ResultsList({
  places = [],
  isLoading = false,
  selectedPlaces = [],
  setSelectedPlaces,
  activePlace,
  setActivePlace,
  hoveredPlaceId,
  setHoveredPlaceId,
  favorites = [],
  onToggleFavorite,
  onOpenRadar,
  displayMode = 'list',
  filters = {},
  leadMetadata = {},
  onOpenDetails
}) {
  const [internalFilter, setInternalFilter] = useState('');
  const [pageSize, setPageSize] = useState(25);

  // Filter and sort items locally
  const processedPlaces = useMemo(() => {
    let result = [...places];

    // Filter by internal search box
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

    // Apply active filter panel rules
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
    if (filters.onlyOpenNow) {
      result = result.filter(p => p.currentOpeningHours?.openNow === true);
    }

    // Sorting
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
      // default: distance
      return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
    });

    return result;
  }, [places, internalFilter, filters]);

  const visiblePlaces = processedPlaces.slice(0, pageSize);

  const isAllSelected = visiblePlaces.length > 0 && visiblePlaces.every(p => {
    const id = p.id || p.place_id;
    return selectedPlaces.some(sp => (sp.id || sp.place_id) === id);
  });

  const handleSelectAll = () => {
    if (isAllSelected) {
      const visibleIds = new Set(visiblePlaces.map(p => p.id || p.place_id));
      setSelectedPlaces(prev => prev.filter(p => !visibleIds.has(p.id || p.place_id)));
    } else {
      const selectedIds = new Set(selectedPlaces.map(p => p.id || p.place_id));
      const newSelections = [...selectedPlaces];
      for (const p of visiblePlaces) {
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

  // Check if a place is favorite
  const isFav = (placeId) => favorites.some(f => (f.id || f.place_id) === placeId);

  if (isLoading) {
    return (
      <div className="results-scroll-container">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="skeleton-row">
            <div className="skeleton-box" style={{ width: '60%', height: '16px' }} />
            <div className="skeleton-box" style={{ width: '85%', height: '12px' }} />
            <div className="skeleton-box" style={{ width: '40%', height: '12px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="empty-state-container">
        <div className="empty-state-icon">
          <MapPinOff size={26} />
        </div>
        <h3 className="empty-state-title">Nenhum estabelecimento encontrado</h3>
        <p className="empty-state-desc">
          Não encontramos resultados para esta busca na região selecionada.
          <br />
          <strong>Sugestão:</strong> Aumente o raio de pesquisa ou experimente termos mais amplos como <em>"odontologia"</em> ou <em>"academia"</em>.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* List Toolbar */}
      <div className="results-toolbar">
        <div className="results-count-title">
          <button 
            type="button" 
            onClick={handleSelectAll} 
            className="btn-ghost" 
            style={{ padding: '2px', display: 'flex', alignItems: 'center' }}
            title={isAllSelected ? "Desmarcar todos da página" : "Selecionar todos da página"}
          >
            {isAllSelected ? <CheckSquare size={16} color="var(--green-accent)" /> : <Square size={16} />}
          </button>
          <span>{processedPlaces.length} empresas</span>
        </div>

        <div className="results-toolbar-actions">
          <div className="results-filter-inline">
            <Search size={13} className="search-icon" />
            <input
              type="text"
              placeholder="Filtrar resultados..."
              value={internalFilter}
              onChange={(e) => setInternalFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Directory List View */}
      {displayMode === 'list' ? (
        <div className="results-scroll-container">
          {visiblePlaces.map((place) => {
            const placeId = place.id || place.place_id;
            const isSelected = selectedPlaces.some(p => (p.id || p.place_id) === placeId);
            const isActive = (activePlace && (activePlace.id || activePlace.place_id) === placeId) || hoveredPlaceId === placeId;

            return (
              <ResultRow
                key={placeId}
                place={place}
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

          {visiblePlaces.length < processedPlaces.length && (
            <div style={{ padding: '16px 20px', textAlign: 'center', background: 'var(--bg-main)' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPageSize(prev => prev + 25)}
              >
                Carregar mais resultados ({processedPlaces.length - visiblePlaces.length} restantes)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Advanced Table View */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '32px' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Empresa</th>
                <th>Categoria</th>
                <th>Telefone</th>
                <th>Website</th>
                <th>Avaliação</th>
                <th>Reviews</th>
                <th>Distância</th>
                <th>Status Lead</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {visiblePlaces.map((place) => {
                const placeId = place.id || place.place_id;
                const isSelected = selectedPlaces.some(p => (p.id || p.place_id) === placeId);
                const isActive = (activePlace && (activePlace.id || activePlace.place_id) === placeId) || hoveredPlaceId === placeId;
                const name = place.displayName?.text || place.name;
                const category = place.primaryTypeDisplayName?.text || place.primaryType || place.category;
                const phone = place.nationalPhoneNumber || place.phone;
                const rawWeb = place.websiteUri || place.website;
                const cleanDomain = extractCleanDomain(rawWeb);
                const meta = leadMetadata[placeId] || { status: 'Novo' };

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
                          {place.rating}
                        </span>
                      ) : '—'}
                    </td>
                    <td>{place.userRatingCount || 0}</td>
                    <td>{formatDistance(place.distanceKm)}</td>
                    <td>
                      <span className="badge badge-green">{meta.status || 'Novo'}</span>
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
