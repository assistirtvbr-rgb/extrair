import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  LocateFixed, 
  SlidersHorizontal, 
  Loader2 
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
  activeFiltersCount = 0,
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
    // Trigger search directly if location is already set
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

  return (
    <div className="search-header-container">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Primary Search Row */}
        <div className="search-primary-row">
          <div className="search-input-wrapper">
            <Search size={17} className="search-icon-inside" />
            <input
              ref={searchInputRef}
              type="text"
              className="search-input-main"
              placeholder="Qual tipo de empresa você procura? (ex: odontologia, academia, restaurante...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tipo de empresa"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !query.trim()}
            style={{ minWidth: '110px', height: '42px', fontWeight: '600' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search size={15} />
                Pesquisar
              </>
            )}
          </button>
        </div>

        {/* Location & Radius Row */}
        <div className="search-controls-row">
          <div className="location-input-wrapper">
            <MapPin size={15} style={{ position: 'absolute', left: '10px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="location-input"
              placeholder="Cidade, bairro, endereço ou CEP (ex: Tijuca, Rio de Janeiro)"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              aria-label="Localização de busca"
            />
            <button
              type="button"
              className="geo-btn-inside"
              onClick={handleLocateClick}
              disabled={locLoading}
              title="Usar minha localização atual (GPS)"
            >
              {locLoading ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
            </button>
          </div>

          {/* Radius selector */}
          <RadiusSelector
            radiusKm={radiusKm}
            setRadiusKm={setRadiusKm}
            onChangeComplete={(val) => {
              if (query.trim() && locationInput.trim()) {
                onSearch(query, locationInput, val);
              }
            }}
          />

          {/* Filters Button */}
          <button
            type="button"
            className={`btn btn-secondary btn-sm ${activeFiltersCount > 0 ? 'active' : ''}`}
            onClick={onOpenFilters}
            style={{ height: '34px', position: 'relative' }}
          >
            <SlidersHorizontal size={14} />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="badge badge-green" style={{ marginLeft: '2px', padding: '1px 5px', fontSize: '10px' }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

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
