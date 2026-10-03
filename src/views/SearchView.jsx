import React, { useState, useRef, useEffect, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import SearchSummary from '../components/SearchSummary';
import ResultsList from '../components/ResultsList';
import MapView from '../components/MapView';
import SelectionBar from '../components/SelectionBar';
import FiltersPanel from '../components/FiltersPanel';

export default function SearchView({
  query,
  setQuery,
  locationInput,
  setLocationInput,
  radiusKm,
  setRadiusKm,
  onSearch,
  onGetCurrentLocation,
  isLoading,
  isLoadingMore,
  apiError,
  hasNextPage,
  onLoadMore,
  places,
  activePlace,
  setActivePlace,
  hoveredPlaceId,
  setHoveredPlaceId,
  selectedPlaces,
  setSelectedPlaces,
  favorites,
  onToggleFavorite,
  onOpenRadar,
  onOpenExport,
  onOpenSaveList,
  onOpenBatchEnrich,
  viewMode,
  filters,
  setFilters,
  onResetFilters,
  leadStore,
  centerLat,
  centerLng,
  radarPlace,
  isFiltersOpen,
  setIsFiltersOpen,
  searchInputRef
}) {
  const containerRef = useRef(null);

  // Resizable split ratio (percentage for list panel)
  const [splitPercent, setSplitPercent] = useState(() => {
    try {
      const saved = localStorage.getItem('leadmap_split_ratio');
      return saved ? parseFloat(saved) : 46;
    } catch {
      return 46;
    }
  });

  const isDraggingRef = useRef(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const newPercent = Math.min(Math.max((clientX / rect.width) * 100, 25), 75);
    setSplitPercent(newPercent);
    localStorage.setItem('leadmap_split_ratio', newPercent.toFixed(1));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleResizerKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      setSplitPercent(prev => Math.max(prev - 5, 25));
    } else if (e.key === 'ArrowRight') {
      setSplitPercent(prev => Math.min(prev + 5, 75));
    }
  };

  return (
    <div className="search-view-layout">
      {/* 1. Full-Width Search Strip Above Results & Map */}
      <div className="search-strip-wrapper">
        <SearchBar
          query={query}
          setQuery={setQuery}
          locationInput={locationInput}
          setLocationInput={setLocationInput}
          radiusKm={radiusKm}
          setRadiusKm={setRadiusKm}
          onSearch={onSearch}
          onCancelSearch={onCancelSearch}
          searchProgress={searchProgress}
          onGetCurrentLocation={onGetCurrentLocation}
          onOpenFilters={() => setIsFiltersOpen(true)}
          filters={filters}
          setFilters={setFilters}
          onResetFilters={onResetFilters}
          isLoading={isLoading}
          searchInputRef={searchInputRef}
        />
      </div>

      {/* 2. Horizontal Insights Summary */}
      <SearchSummary
        places={places}
        leadStore={leadStore}
      />

      {/* 3. Work Area: Resizable Split / List / Map / Table */}
      <div 
        ref={containerRef}
        className={`content-split view-mode-${viewMode}`}
      >
        {/* Left List Panel */}
        <div 
          className="split-list-panel" 
          style={{ width: viewMode === 'split' ? `${splitPercent}%` : undefined }}
        >
          <ResultsList
            places={places}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasSearchedOnce={hasSearchedOnce}
            apiError={apiError}
            hasNextPage={hasNextPage}
            onLoadMore={onLoadMore}
            selectedPlaces={selectedPlaces}
            setSelectedPlaces={setSelectedPlaces}
            activePlace={activePlace}
            setActivePlace={setActivePlace}
            hoveredPlaceId={hoveredPlaceId}
            setHoveredPlaceId={setHoveredPlaceId}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onOpenRadar={onOpenRadar}
            viewMode={viewMode}
            filters={filters}
            leadStore={leadStore}
            onOpenDetails={(place) => setActivePlace(place)}
          />
        </div>

        {/* Resizable Divider for Split View */}
        {viewMode === 'split' && (
          <div
            className="split-resizer"
            onMouseDown={handleMouseDown}
            onKeyDown={handleResizerKeyDown}
            tabIndex={0}
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionar painel de lista e mapa"
          />
        )}

        {/* Right Map Panel */}
        <div className="split-map-panel">
          <MapView
            places={places}
            centerLat={centerLat}
            centerLng={centerLng}
            radiusKm={radiusKm}
            activePlace={activePlace}
            hoveredPlaceId={hoveredPlaceId}
            onSelectPlace={(place) => setActivePlace(place)}
            onHoverPlace={(id) => setHoveredPlaceId(id)}
            radarPlace={radarPlace}
            onMapClickExplore={(newLat, newLng) => {
              onSearch(query, `${newLat.toFixed(4)}, ${newLng.toFixed(4)}`, radiusKm, newLat, newLng);
            }}
          />
        </div>

        {/* Floating Selection Bar */}
        <SelectionBar
          selectedCount={selectedPlaces.length}
          onClearSelection={() => setSelectedPlaces([])}
          onAddToList={onOpenSaveList}
          onExport={onOpenExport}
          onBatchEnrich={onOpenBatchEnrich}
        />

        {/* Filters Modal */}
        <FiltersPanel
          isOpen={isFiltersOpen}
          onClose={() => setIsFiltersOpen(false)}
          filters={filters}
          setFilters={setFilters}
          onReset={onResetFilters}
        />
      </div>
    </div>
  );
}
