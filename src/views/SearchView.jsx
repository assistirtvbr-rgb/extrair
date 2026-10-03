import React from 'react';
import SearchBar from '../components/SearchBar';
import SearchSummary from '../components/SearchSummary';
import ResultsList from '../components/ResultsList';
import MapView from '../components/MapView';
import BusinessDetails from '../components/BusinessDetails';
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
  viewMode,
  displayMode,
  setDisplayMode,
  filters,
  setFilters,
  onResetFilters,
  leadMetadata,
  onUpdateLeadMeta,
  centerLat,
  centerLng,
  radarPlace,
  isFiltersOpen,
  setIsFiltersOpen,
  searchInputRef
}) {
  const activeFiltersCount = (
    (filters.minRating > 0 ? 1 : 0) +
    (filters.minReviews > 0 ? 1 : 0) +
    (filters.onlyWithPhone ? 1 : 0) +
    (filters.onlyWithWebsite ? 1 : 0) +
    (filters.onlyOpenNow ? 1 : 0)
  );

  return (
    <div className={`content-split view-mode-${viewMode}`}>
      {/* Left List Panel */}
      <div className="split-list-panel">
        <SearchBar
          query={query}
          setQuery={setQuery}
          locationInput={locationInput}
          setLocationInput={setLocationInput}
          radiusKm={radiusKm}
          setRadiusKm={setRadiusKm}
          onSearch={onSearch}
          onGetCurrentLocation={onGetCurrentLocation}
          onOpenFilters={() => setIsFiltersOpen(true)}
          activeFiltersCount={activeFiltersCount}
          isLoading={isLoading}
          searchInputRef={searchInputRef}
        />

        <SearchSummary
          places={places}
          displayMode={displayMode}
          setDisplayMode={setDisplayMode}
        />

        <ResultsList
          places={places}
          isLoading={isLoading}
          selectedPlaces={selectedPlaces}
          setSelectedPlaces={setSelectedPlaces}
          activePlace={activePlace}
          setActivePlace={setActivePlace}
          hoveredPlaceId={hoveredPlaceId}
          setHoveredPlaceId={setHoveredPlaceId}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          onOpenRadar={onOpenRadar}
          displayMode={displayMode}
          filters={filters}
          leadMetadata={leadMetadata}
          onOpenDetails={(place) => setActivePlace(place)}
        />
      </div>

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

      {/* Slide Drawer for Selected Business */}
      <BusinessDetails
        isOpen={Boolean(activePlace)}
        place={activePlace}
        onClose={() => setActivePlace(null)}
        isFavorite={Boolean(activePlace && favorites.some(f => (f.id || f.place_id) === (activePlace.id || activePlace.place_id)))}
        onToggleFavorite={onToggleFavorite}
        onAddToList={(p) => {
          setSelectedPlaces([p]);
          onOpenSaveList();
        }}
        onOpenRadar={onOpenRadar}
        leadMeta={activePlace ? (leadMetadata[activePlace.id || activePlace.place_id] || {}) : {}}
        onUpdateLeadMeta={onUpdateLeadMeta}
      />

      {/* Floating Selection Bar */}
      <SelectionBar
        selectedCount={selectedPlaces.length}
        onClearSelection={() => setSelectedPlaces([])}
        onAddToList={onOpenSaveList}
        onExport={onOpenExport}
      />

      {/* Filters Modal / Popover */}
      <FiltersPanel
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        setFilters={setFilters}
        onReset={onResetFilters}
      />
    </div>
  );
}
