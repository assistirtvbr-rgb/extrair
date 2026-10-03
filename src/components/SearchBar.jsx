import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  LocateFixed, 
  SlidersHorizontal, 
  Loader2,
  X,
  Sparkles
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
  const [showAllCategories, setShowAllCategories] = useState(false);

  const mainCategories = [
    { label: 'Dentistas', query: 'odontologia' },
    { label: 'Academias', query: 'academia' },
    { label: 'Restaurantes', query: 'restaurante' },
    { label: 'Farmácias', query: 'farmácia' },
    { label: 'Pet shops', query: 'pet shop' },
    { label: 'Advogados', query: 'advogado' },
    { label: 'Imobiliárias', query: 'imobiliária' },
    { label: 'Salões de Beleza', query: 'salão de beleza' }
  ];

  const extraCategories = [
    { label: 'Oficinas Mecânicas', query: 'oficina mecânica' },
    { label: 'Contabilidade', query: 'escritório de contabilidade' },
    { label: 'Clínicas Médicas', query: 'clínica médica' },
    { label: 'Supermercados', query: 'supermercado' },
    { label: 'Escolas', query: 'escola' },
    { label: 'Hotéis', query: 'hotel' }
  ];

  const handleCategoryClick = (catQuery) => {
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
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Horizontal Primary Search Controls Bar */}
        <div className="search-primary-row">
          {/* Segment Input */}
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon-inside" />
            <input
              ref={searchInputRef}
              type="text"
              className="search-input-main"
              placeholder="Qual segmento ou tipo de empresa? (ex: odontologia, academias, restaurantes...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tipo de empresa"
            />
          </div>

          {/* Location Input (CEP or City) */}
          <div className="location-input-wrapper">
            <MapPin size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="location-input"
              placeholder="Cidade, bairro ou CEP (ex: 26150-387 ou Belford Roxo)"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              aria-label="Localização de busca"
            />
            <button
              type="button"
              className="geo-btn-inside"
              onClick={handleLocateClick}
              disabled={locLoading}
              title="Obter minha localização GPS"
            >
              {locLoading ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
            </button>
          </div>

          {/* Radius Selector Popover */}
          <RadiusSelector
            radiusKm={radiusKm}
            setRadiusKm={setRadiusKm}
          />

          {/* Filters Toggle Button */}
          <button
            type="button"
            className={`btn btn-secondary ${activeFilters.length > 0 ? 'active' : ''}`}
            onClick={onOpenFilters}
            style={{ height: '46px', padding: '0 14px' }}
          >
            <SlidersHorizontal size={15} />
            <span>Filtros</span>
            {activeFilters.length > 0 && (
              <span className="badge badge-brand" style={{ padding: '1px 6px', fontSize: '11px' }}>
                {activeFilters.length}
              </span>
            )}
          </button>

          {/* Primary Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !query.trim()}
            style={{ height: '46px', padding: '0 22px', fontSize: '14px', minWidth: '150px' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>Buscar Empresas</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="quick-chips-row">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Sugestões:
          </span>
          {(showAllCategories ? [...mainCategories, ...extraCategories] : mainCategories).map((cat) => (
            <button
              key={cat.label}
              type="button"
              className="quick-chip"
              onClick={() => handleCategoryClick(cat.query)}
            >
              {cat.label}
            </button>
          ))}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowAllCategories(!showAllCategories)}
            style={{ fontSize: '12px', fontWeight: '600', color: 'var(--brand-primary)', padding: '4px 8px' }}
          >
            {showAllCategories ? 'Menos sugestões' : '+ Mais segmentos'}
          </button>
        </div>

        {/* Removable Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="active-filters-chips-row">
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Filtros ativos:</span>
            {activeFilters.map(f => (
              <span key={f.key} className="active-filter-tag">
                {f.label}
                <X size={13} className="active-filter-remove" onClick={f.reset} />
              </span>
            ))}
            <button
              type="button"
              className="btn-ghost"
              onClick={onResetFilters}
              style={{ fontSize: '12px', padding: '2px 8px', color: 'var(--text-muted)', fontWeight: '600' }}
            >
              Limpar todos
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
