import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  LocateFixed, 
  SlidersHorizontal, 
  Loader2,
  X,
  RotateCcw
} from 'lucide-react';
import RadiusSelector from './RadiusSelector';

export default function SearchBar({
  query,
  setQuery,
  locationInput,
  setLocationInput,
  radiusKm,
  setRadiusKm,
  onSearch,
  onGetCurrentLocation,
  onOpenFilters,
  filters,
  setFilters,
  onResetFilters,
  isLoading = false,
  searchInputRef
}) {
  const [locLoading, setLocLoading] = useState(false);

  const quickCategories = [
    { label: 'Dentistas', query: 'odontologia' },
    { label: 'Academias', query: 'academia' },
    { label: 'Pet shops', query: 'pet shop' },
    { label: 'Restaurantes', query: 'restaurante' },
    { label: 'Advogados', query: 'advogado' },
    { label: 'Imobiliárias', query: 'imobiliária' },
    { label: 'Salões', query: 'salão de beleza' }
  ];

  const handleQuickChipClick = (catQuery) => {
    setQuery(catQuery);
    if (locationInput.trim()) {
      onSearch(catQuery, locationInput, radiusKm);
    }
  };

  const handleLocateClick = async () => {
    try {
      setLocLoading(true);
      await onGetCurrentLocation();
    } finally {
      setLocLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query, locationInput, radiusKm);
  };

  // Build active filter items
  const activeFilters = [];
  if (filters.minRating > 0) activeFilters.push({ key: 'minRating', label: `★ ${filters.minRating}+`, reset: () => setFilters(f => ({ ...f, minRating: 0 })) });
  if (filters.minReviews > 0) activeFilters.push({ key: 'minReviews', label: `${filters.minReviews}+ avaliações`, reset: () => setFilters(f => ({ ...f, minReviews: 0 })) });
  if (filters.onlyWithPhone) activeFilters.push({ key: 'phone', label: 'Com telefone', reset: () => setFilters(f => ({ ...f, onlyWithPhone: false })) });
  if (filters.onlyWithWebsite) activeFilters.push({ key: 'web', label: 'Com website', reset: () => setFilters(f => ({ ...f, onlyWithWebsite: false })) });
  if (filters.onlyWithInstagram) activeFilters.push({ key: 'ig', label: 'Instagram encontrado', reset: () => setFilters(f => ({ ...f, onlyWithInstagram: false })) });
  if (filters.onlyWithWhatsApp) activeFilters.push({ key: 'wa', label: 'WhatsApp encontrado', reset: () => setFilters(f => ({ ...f, onlyWithWhatsApp: false })) });
  if (filters.onlyOpenNow) activeFilters.push({ key: 'open', label: 'Aberto agora', reset: () => setFilters(f => ({ ...f, onlyOpenNow: false })) });

  return (
    <div className="search-header-container">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Primary Search Row */}
        <div className="search-primary-row">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon-inside" />
            <input
              ref={searchInputRef}
              type="text"
              className="search-input-main"
              placeholder="Qual tipo de empresa você procura? (ex: odontologia, pet shop, advogados...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tipo de empresa"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !query.trim()}
            style={{ minWidth: '105px', height: '38px', fontWeight: '600' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search size={14} />
                Pesquisar
              </>
            )}
          </button>
        </div>

        {/* Location & Controls Row */}
        <div className="search-controls-row">
          <div className="location-input-wrapper">
            <MapPin size={14} style={{ position: 'absolute', left: '9px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="location-input"
              placeholder="Cidade, bairro ou CEP (ex: Belford Roxo - RJ)"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              aria-label="Localização de busca"
            />
            <button
              type="button"
              className="geo-btn-inside"
              onClick={handleLocateClick}
              disabled={locLoading}
              title="Usar minha localização GPS"
            >
              {locLoading ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
            </button>
          </div>

          <RadiusSelector
            radiusKm={radiusKm}
            setRadiusKm={setRadiusKm}
            onChangeComplete={(val) => {
              if (query.trim() && locationInput.trim()) {
                onSearch(query, locationInput, val);
              }
            }}
          />

          <button
            type="button"
            className={`btn btn-secondary btn-sm ${activeFilters.length > 0 ? 'active' : ''}`}
            onClick={onOpenFilters}
            style={{ height: '32px' }}
          >
            <SlidersHorizontal size={13} />
            Filtros
            {activeFilters.length > 0 && (
              <span className="badge badge-lime" style={{ padding: '0 4px', fontSize: '10px' }}>
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* Removable active filter pills */}
        {activeFilters.length > 0 && (
          <div className="active-filters-chips-row">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Filtros ativos:</span>
            {activeFilters.map(f => (
              <span key={f.key} className="active-filter-tag">
                {f.label}
                <X size={12} className="active-filter-remove" onClick={f.reset} />
              </span>
            ))}
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={onResetFilters}
              style={{ fontSize: '11px', padding: '1px 4px', color: 'var(--text-muted)' }}
            >
              Limpar todos
            </button>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="quick-chips-row">
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginRight: '2px' }}>
            Sugestões:
          </span>
          {quickCategories.map((cat) => (
            <button
              key={cat.label}
              type="button"
              className="quick-chip"
              onClick={() => handleQuickChipClick(cat.query)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
