import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import SearchView from './views/SearchView';
import PipelineView from './views/PipelineView';
import ListsView from './views/ListsView';
import FavoritesView from './views/FavoritesView';
import HistoryView from './views/HistoryView';
import ComparatorView from './views/ComparatorView';
import SettingsView from './views/SettingsView';
import BusinessDetails from './components/BusinessDetails';
import ExportModal from './components/ExportModal';
import AddToListModal from './components/AddToListModal';
import RadarModal from './components/RadarModal';
import BatchEnrichModal from './components/BatchEnrichModal';
import CommandPalette from './components/CommandPalette';

import { placesService } from './services/placesService';
import { geoService } from './services/geoService';
import { storageService } from './services/storageService';

export default function App() {
  const [currentView, setCurrentView] = useState('search'); // 'search' | 'pipeline' | 'lists' | 'favorites' | 'comparator' | 'history' | 'settings'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'list' | 'map' | 'table'

  // Settings & Mode
  const [settings, setSettings] = useState(() => storageService.getSettings());
  const [isDemoMode, setIsDemoMode] = useState(settings.demoMode ?? false);

  // Search state
  const [query, setQuery] = useState('odontologia');
  const [locationInput, setLocationInput] = useState('Belford Roxo - RJ');
  const [radiusKm, setRadiusKm] = useState(5);
  const [centerLat, setCenterLat] = useState(-22.7639);
  const [centerLng, setCenterLng] = useState(-43.3994);
  const [places, setPlaces] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Selection & Details (Centralized)
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [activePlace, setActivePlace] = useState(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState(null);

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [radarTargetPlace, setRadarTargetPlace] = useState(null);
  const [isBatchEnrichOpen, setIsBatchEnrichOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    minRating: 0,
    minReviews: 0,
    onlyWithPhone: false,
    onlyWithWebsite: false,
    onlyWithInstagram: false,
    onlyWithWhatsApp: false,
    onlyOpenNow: false,
    sortBy: 'distance'
  });

  // Unified Lead Store (CRM, Tags, Notes, Digital Presence)
  const [leadStore, setLeadStore] = useState(storageService.getAllLeads());
  const [favorites, setFavorites] = useState(storageService.getFavorites());
  const [lists, setLists] = useState(storageService.getLists());

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const activeAbortControllerRef = useRef(null);
  const searchInputRef = useRef(null);

  const showToast = (text, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Sync state helper
  const reloadData = useCallback(() => {
    setLeadStore(storageService.getAllLeads());
    setFavorites(storageService.getFavorites());
    setLists(storageService.getLists());
  }, []);

  // Perform Primary Search
  const handleSearch = useCallback(async (searchQuery, searchLocation, searchRadius, customLat = null, customLng = null) => {
    // Cancel in-flight search
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;

    setIsLoading(true);
    setApiError(null);
    setActivePlace(null);
    setSelectedPlaces([]);

    try {
      let lat = customLat;
      let lng = customLng;
      let locName = searchLocation;

      if (lat === null || lng === null) {
        const geo = await geoService.geocode(searchLocation || 'Belford Roxo - RJ', isDemoMode);
        lat = geo.lat;
        lng = geo.lng;
        locName = geo.displayName || searchLocation;
      }

      setCenterLat(lat);
      setCenterLng(lng);

      const res = await placesService.searchPlaces({
        query: searchQuery,
        locationName: locName,
        latitude: lat,
        longitude: lng,
        radiusKm: searchRadius,
        isDemo: isDemoMode,
        abortSignal: abortController.signal
      });

      if (res.error) {
        setApiError(res.error);
        setPlaces([]);
        setNextPageToken(null);
      } else {
        setPlaces(res.places || []);
        setNextPageToken(res.nextPageToken || null);
        setApiError(null);

        // Save to history
        storageService.addHistory({
          query: searchQuery,
          locationName: locName,
          lat,
          lng,
          radiusKm: searchRadius,
          resultsCount: (res.places || []).length
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setApiError({ message: err.message, code: 'SEARCH_ERROR' });
        setPlaces([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  // Real Pagination: Load Next Page from API
  const handleLoadMore = async () => {
    if (!nextPageToken || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const res = await placesService.searchPlaces({
        query,
        locationName: locationInput,
        latitude: centerLat,
        longitude: centerLng,
        radiusKm,
        pageToken: nextPageToken,
        isDemo: isDemoMode
      });

      if (res.places && res.places.length > 0) {
        // Deduplicate places
        const existingIds = new Set(places.map(p => p.id || p.place_id));
        const newPlaces = res.places.filter(p => !existingIds.has(p.id || p.place_id));
        setPlaces(prev => [...prev, ...newPlaces]);
        setNextPageToken(res.nextPageToken || null);
        showToast(`${newPlaces.length} novos estabelecimentos carregados.`);
      } else {
        setNextPageToken(null);
      }
    } catch (err) {
      showToast('Não foi possível carregar mais resultados.', 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleSearch('odontologia', 'Belford Roxo - RJ', 5);
  }, [handleSearch]);

  // GPS Location handler
  const handleGetCurrentLocation = async () => {
    try {
      const pos = await geoService.getCurrentLocation();
      setLocationInput(pos.displayName);
      setCenterLat(pos.lat);
      setCenterLng(pos.lng);
      handleSearch(query, pos.displayName, radiusKm, pos.lat, pos.lng);
      showToast(`Localização obtida: ${pos.displayName}`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Lead CRM update
  const handleUpdateLead = (placeId, updates, placeData = null) => {
    storageService.updateLead(placeId, updates, placeData);
    reloadData();
  };

  const handleAddActivity = (placeId, activityText, type) => {
    storageService.addLeadActivity(placeId, activityText, type);
    reloadData();
    showToast('Atividade registrada na ficha comercial.');
  };

  // Toggle favorite
  const handleToggleFavorite = (place) => {
    const isNowFav = storageService.toggleFavorite(place);
    reloadData();
    showToast(isNowFav ? 'Adicionado aos favoritos ⭐' : 'Removido dos favoritos');
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      minRating: 0,
      minReviews: 0,
      onlyWithPhone: false,
      onlyWithWebsite: false,
      onlyWithInstagram: false,
      onlyWithWhatsApp: false,
      onlyOpenNow: false,
      sortBy: 'distance'
    });
    showToast('Filtros resetados.');
  };

  // Toggle Demo Mode
  const handleToggleDemoMode = (targetMode) => {
    const nextVal = typeof targetMode === 'boolean' ? targetMode : !isDemoMode;
    setIsDemoMode(nextVal);
    storageService.saveSettings({ ...settings, demoMode: nextVal });
    showToast(nextVal ? 'Modo Demonstração Ativado' : 'Modo Google Places Live Ativado');
    handleSearch(query, locationInput, radiusKm);
  };

  // Open Radar
  const handleOpenRadar = (place) => {
    setRadarTargetPlace(place);
    setIsRadarOpen(true);
  };

  // Keyboard Shortcuts (Ctrl+K, Esc, Ctrl+A)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K: Command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }

      // Esc: close active drawer or modals
      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        else if (isBatchEnrichOpen) setIsBatchEnrichOpen(false);
        else if (isExportOpen) setIsExportOpen(false);
        else if (isAddToListOpen) setIsAddToListOpen(false);
        else if (isRadarOpen) setIsRadarOpen(false);
        else if (isFiltersOpen) setIsFiltersOpen(false);
        else if (activePlace) setActivePlace(null);
      }

      // Ctrl/Cmd + A: select all when on search view
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && currentView === 'search' && !isExportOpen && !isAddToListOpen && !isRadarOpen && !isCommandPaletteOpen) {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (places.length > 0) {
            setSelectedPlaces(places);
            showToast(`${places.length} empresas selecionadas.`);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, isExportOpen, isAddToListOpen, isRadarOpen, isFiltersOpen, isBatchEnrichOpen, isCommandPaletteOpen, activePlace, places]);

  return (
    <div className="app-layout">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        listsCount={lists.length}
        favoritesCount={favorites.length}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => handleToggleDemoMode(!isDemoMode)}
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
          onOpenBatchEnrich={() => setIsBatchEnrichOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
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
              isLoadingMore={isLoadingMore}
              apiError={apiError}
              hasNextPage={Boolean(nextPageToken)}
              onLoadMore={handleLoadMore}
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
              onOpenBatchEnrich={() => setIsBatchEnrichOpen(true)}
              viewMode={viewMode}
              filters={filters}
              setFilters={setFilters}
              onResetFilters={handleResetFilters}
              leadStore={leadStore}
              centerLat={centerLat}
              centerLng={centerLng}
              radarPlace={radarTargetPlace}
              isFiltersOpen={isFiltersOpen}
              setIsFiltersOpen={setIsFiltersOpen}
              searchInputRef={searchInputRef}
            />
          )}

          {currentView === 'pipeline' && (
            <PipelineView
              leadStore={leadStore}
              onUpdateLead={handleUpdateLead}
              onOpenDetails={(p) => setActivePlace(p)}
            />
          )}

          {currentView === 'lists' && (
            <ListsView
              onOpenDetails={(p) => setActivePlace(p)}
              leadStore={leadStore}
              onUpdateLead={handleUpdateLead}
            />
          )}

          {currentView === 'favorites' && (
            <FavoritesView
              favorites={favorites}
              leadStore={leadStore}
              onToggleFavorite={handleToggleFavorite}
              onOpenDetails={(p) => setActivePlace(p)}
              onAddToList={(p) => {
                setSelectedPlaces([p]);
                setIsAddToListOpen(true);
              }}
            />
          )}

          {currentView === 'comparator' && (
            <ComparatorView isDemoMode={isDemoMode} />
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
            <SettingsView
              onDataReset={reloadData}
              isDemoMode={isDemoMode}
              onToggleDemoMode={handleToggleDemoMode}
            />
          )}
        </main>
      </div>

      {/* Centralized Business Details Drawer (Available across all screens) */}
      <BusinessDetails
        isOpen={Boolean(activePlace)}
        place={activePlace}
        onClose={() => setActivePlace(null)}
        isFavorite={Boolean(activePlace && favorites.some(f => (f.id || f.place_id) === (activePlace.id || activePlace.place_id)))}
        onToggleFavorite={handleToggleFavorite}
        onAddToList={(p) => {
          setSelectedPlaces([p]);
          setIsAddToListOpen(true);
        }}
        onOpenRadar={handleOpenRadar}
        leadData={activePlace ? (leadStore[activePlace.id || activePlace.place_id] || {}) : {}}
        onUpdateLead={handleUpdateLead}
        onAddActivity={handleAddActivity}
      />

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

      <BatchEnrichModal
        isOpen={isBatchEnrichOpen}
        onClose={() => setIsBatchEnrichOpen(false)}
        places={selectedPlaces.length > 0 ? selectedPlaces : places}
        onEnrichmentComplete={reloadData}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(viewId) => setCurrentView(viewId)}
        onTriggerAction={(actionId) => {
          if (actionId === 'enrich') setIsBatchEnrichOpen(true);
          else if (actionId === 'export') setIsExportOpen(true);
          else if (actionId === 'clear_filters') handleResetFilters();
        }}
      />

      {/* Toast Feedback Messages */}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} className="toast-message">
            <span>{toast.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
