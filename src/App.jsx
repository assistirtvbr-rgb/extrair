import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import SearchView from './views/SearchView';
import ListsView from './views/ListsView';
import FavoritesView from './views/FavoritesView';
import HistoryView from './views/HistoryView';
import ComparatorView from './views/ComparatorView';
import SettingsView from './views/SettingsView';
import ExportModal from './components/ExportModal';
import AddToListModal from './components/AddToListModal';
import RadarModal from './components/RadarModal';

import { placesService } from './services/placesService';
import { geoService } from './services/geoService';
import { storageService } from './services/storageService';

export default function App() {
  const [currentView, setCurrentView] = useState('search'); // 'search' | 'lists' | 'favorites' | 'comparator' | 'history' | 'settings'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'list' | 'map'
  const [displayMode, setDisplayMode] = useState('list'); // 'list' | 'table'

  // Search state
  const [query, setQuery] = useState('odontologia');
  const [locationInput, setLocationInput] = useState('Tijuca, Rio de Janeiro');
  const [radiusKm, setRadiusKm] = useState(5);
  const [centerLat, setCenterLat] = useState(-22.9248);
  const [centerLng, setCenterLng] = useState(-43.2326);
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMockApi, setIsMockApi] = useState(true);

  // Selection & Details
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [activePlace, setActivePlace] = useState(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState(null);

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [radarTargetPlace, setRadarTargetPlace] = useState(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    minRating: 0,
    minReviews: 0,
    onlyWithPhone: false,
    onlyWithWebsite: false,
    onlyOpenNow: false,
    sortBy: 'distance'
  });

  // Local storage reactive states
  const [favorites, setFavorites] = useState(storageService.getFavorites());
  const [lists, setLists] = useState(storageService.getLists());
  const [leadMetadata, setLeadMetadata] = useState(storageService.getAllLeadMetadata());

  const searchInputRef = useRef(null);

  // Sync favorites & lists helper
  const reloadData = useCallback(() => {
    setFavorites(storageService.getFavorites());
    setLists(storageService.getLists());
    setLeadMetadata(storageService.getAllLeadMetadata());
  }, []);

  // Perform search
  const handleSearch = useCallback(async (searchQuery, searchLocation, searchRadius, customLat = null, customLng = null) => {
    setIsLoading(true);
    setActivePlace(null);
    setSelectedPlaces([]);

    try {
      let lat = customLat;
      let lng = customLng;
      let locName = searchLocation;

      if (lat === null || lng === null) {
        const geo = await geoService.geocode(searchLocation || 'Tijuca, Rio de Janeiro');
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
          locName = geo.displayName || searchLocation;
        } else {
          lat = -22.9248;
          lng = -43.2326;
        }
      }

      setCenterLat(lat);
      setCenterLng(lng);

      const res = await placesService.searchPlaces({
        query: searchQuery,
        latitude: lat,
        longitude: lng,
        radiusKm: searchRadius
      });

      setPlaces(res.places || []);
      setIsMockApi(res.isMock);

      // Save to history
      storageService.addHistory({
        query: searchQuery,
        locationName: locName,
        lat,
        lng,
        radiusKm: searchRadius,
        resultsCount: (res.places || []).length
      });

    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial search on mount
  useEffect(() => {
    handleSearch('odontologia', 'Tijuca, Rio de Janeiro', 5);
  }, [handleSearch]);

  // Handle GPS location
  const handleGetCurrentLocation = async () => {
    try {
      const pos = await geoService.getCurrentLocation();
      setLocationInput(pos.displayName);
      setCenterLat(pos.lat);
      setCenterLng(pos.lng);
      handleSearch(query, pos.displayName, radiusKm, pos.lat, pos.lng);
    } catch (err) {
      alert(err.message || 'Erro ao obter GPS');
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (place) => {
    storageService.toggleFavorite(place);
    reloadData();
  };

  // Update lead metadata (notes, CRM status, tags)
  const handleUpdateLeadMeta = (placeId, updates) => {
    storageService.updateLeadMetadata(placeId, updates);
    reloadData();
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      minRating: 0,
      minReviews: 0,
      onlyWithPhone: false,
      onlyWithWebsite: false,
      onlyOpenNow: false,
      sortBy: 'distance'
    });
  };

  // Open Radar
  const handleOpenRadar = (place) => {
    setRadarTargetPlace(place);
    setIsRadarOpen(true);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K: focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (currentView !== 'search') setCurrentView('search');
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            searchInputRef.current.select();
          }
        }, 50);
      }

      // Esc: close active drawer or modals
      if (e.key === 'Escape') {
        if (isExportOpen) setIsExportOpen(false);
        else if (isAddToListOpen) setIsAddToListOpen(false);
        else if (isRadarOpen) setIsRadarOpen(false);
        else if (isFiltersOpen) setIsFiltersOpen(false);
        else if (activePlace) setActivePlace(null);
      }

      // Ctrl/Cmd + A: select all when on search list
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && currentView === 'search' && !isExportOpen && !isAddToListOpen && !isRadarOpen) {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (places.length > 0) {
            setSelectedPlaces(places);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, isExportOpen, isAddToListOpen, isRadarOpen, isFiltersOpen, activePlace, places]);

  return (
    <div className="app-layout">
      {/* Primary Left Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        listsCount={lists.length}
        favoritesCount={favorites.length}
        isMockApi={isMockApi}
      />

      {/* Main Workspace Area */}
      <div className="app-main">
        {/* Topbar */}
        <Topbar
          currentView={currentView}
          viewMode={viewMode}
          setViewMode={setViewMode}
          totalResults={places.length}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenSaveList={() => setIsAddToListOpen(true)}
          onOpenFilters={() => setIsFiltersOpen(true)}
        />

        {/* View Switcher */}
        <main className="app-content">
          {currentView === 'search' && (
            <SearchView
              query={query}
              setQuery={setQuery}
              locationInput={locationInput}
              setLocationInput={setLocationInput}
              radiusKm={radiusKm}
              setRadiusKm={setRadiusKm}
              onSearch={handleSearch}
              onGetCurrentLocation={handleGetCurrentLocation}
              isLoading={isLoading}
              places={places}
              activePlace={activePlace}
              setActivePlace={setActivePlace}
              hoveredPlaceId={hoveredPlaceId}
              setHoveredPlaceId={setHoveredPlaceId}
              selectedPlaces={selectedPlaces}
              setSelectedPlaces={setSelectedPlaces}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onOpenRadar={handleOpenRadar}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenSaveList={() => setIsAddToListOpen(true)}
              viewMode={viewMode}
              displayMode={displayMode}
              setDisplayMode={setDisplayMode}
              filters={filters}
              setFilters={setFilters}
              onResetFilters={handleResetFilters}
              leadMetadata={leadMetadata}
              onUpdateLeadMeta={handleUpdateLeadMeta}
              centerLat={centerLat}
              centerLng={centerLng}
              radarPlace={radarTargetPlace}
              isFiltersOpen={isFiltersOpen}
              setIsFiltersOpen={setIsFiltersOpen}
              searchInputRef={searchInputRef}
            />
          )}

          {currentView === 'lists' && (
            <ListsView
              onOpenDetails={(p) => setActivePlace(p)}
              leadMetadata={leadMetadata}
              onUpdateLeadMeta={handleUpdateLeadMeta}
            />
          )}

          {currentView === 'favorites' && (
            <FavoritesView
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onOpenDetails={(p) => setActivePlace(p)}
              onAddToList={(p) => {
                setSelectedPlaces([p]);
                setIsAddToListOpen(true);
              }}
            />
          )}

          {currentView === 'comparator' && (
            <ComparatorView />
          )}

          {currentView === 'history' && (
            <HistoryView
              onReplaySearch={(q, loc, rad, lat, lng) => {
                setQuery(q);
                setLocationInput(loc);
                setRadiusKm(rad);
                setCurrentView('search');
                handleSearch(q, loc, rad, lat, lng);
              }}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView onDataReset={reloadData} />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        places={selectedPlaces.length > 0 ? selectedPlaces : places}
      />

      <AddToListModal
        isOpen={isAddToListOpen}
        onClose={() => setIsAddToListOpen(false)}
        places={selectedPlaces.length > 0 ? selectedPlaces : places}
        onListUpdated={reloadData}
      />

      <RadarModal
        isOpen={isRadarOpen}
        place={radarTargetPlace}
        onClose={() => setIsRadarOpen(false)}
        onViewOnMap={(p) => {
          setActivePlace(p);
          setCurrentView('search');
        }}
      />
    </div>
  );
}
