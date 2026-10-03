const STORAGE_KEYS = {
  LISTS: 'leadmap_lists',
  FAVORITES: 'leadmap_favorites',
  HISTORY: 'leadmap_history',
  LEAD_METADATA: 'leadmap_lead_metadata',
  SETTINGS: 'leadmap_settings'
};

const DEFAULT_SETTINGS = {
  workerApiUrl: import.meta.env.VITE_WORKER_API_URL || 'http://localhost:8787/api/search',
  defaultRadiusKm: 5,
  defaultSort: 'distance',
  autoSaveHistory: true,
  tableColumns: {
    name: true,
    category: true,
    rating: true,
    phone: true,
    website: true,
    distance: true,
    address: true,
    status: true,
    tags: true
  }
};

export const storageService = {
  // Settings
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  
  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  },

  // Lists
  getLists() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LISTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveList(name, places = []) {
    try {
      const lists = this.getLists();
      const newList = {
        id: 'list_' + Date.now(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        places: places // full or minimal objects
      };
      lists.unshift(newList);
      localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
      return newList;
    } catch (e) {
      console.error('Failed to save list', e);
      return null;
    }
  },

  addPlacesToList(listId, newPlaces) {
    try {
      const lists = this.getLists();
      const list = lists.find(l => l.id === listId);
      if (!list) return false;

      const existingIds = new Set(list.places.map(p => p.id || p.place_id));
      for (const p of newPlaces) {
        const id = p.id || p.place_id;
        if (!existingIds.has(id)) {
          list.places.push(p);
          existingIds.add(id);
        }
      }
      localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
      return true;
    } catch (e) {
      console.error('Failed to add places to list', e);
      return false;
    }
  },

  removePlaceFromList(listId, placeId) {
    try {
      const lists = this.getLists();
      const list = lists.find(l => l.id === listId);
      if (!list) return false;

      list.places = list.places.filter(p => (p.id || p.place_id) !== placeId);
      localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
      return true;
    } catch (e) {
      console.error('Failed to remove place from list', e);
      return false;
    }
  },

  deleteList(listId) {
    try {
      const lists = this.getLists().filter(l => l.id !== listId);
      localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
      return true;
    } catch (e) {
      console.error('Failed to delete list', e);
      return false;
    }
  },

  // Favorites
  getFavorites() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isFavorite(placeId) {
    const favs = this.getFavorites();
    return favs.some(f => (f.id || f.place_id) === placeId);
  },

  toggleFavorite(place) {
    try {
      let favs = this.getFavorites();
      const placeId = place.id || place.place_id;
      const index = favs.findIndex(f => (f.id || f.place_id) === placeId);
      
      if (index >= 0) {
        favs.splice(index, 1);
      } else {
        favs.unshift({
          ...place,
          savedAt: new Date().toISOString()
        });
      }
      
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
      return index < 0; // returns true if now favorite
    } catch (e) {
      console.error('Failed to toggle favorite', e);
      return false;
    }
  },

  // History
  getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addHistory(entry) {
    try {
      let history = this.getHistory();
      // Remove duplicate recent identical searches
      history = history.filter(h => !(h.query === entry.query && h.locationName === entry.locationName && h.radiusKm === entry.radiusKm));
      
      const newEntry = {
        id: 'hist_' + Date.now(),
        query: entry.query,
        locationName: entry.locationName,
        lat: entry.lat,
        lng: entry.lng,
        radiusKm: entry.radiusKm,
        resultsCount: entry.resultsCount || 0,
        createdAt: new Date().toISOString()
      };
      
      history.unshift(newEntry);
      // Keep max 50 items
      if (history.length > 50) history.pop();
      
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
      return newEntry;
    } catch (e) {
      console.error('Failed to add history', e);
      return null;
    }
  },

  clearHistory() {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  },

  // Lead metadata: notes, tags, CRM status
  getLeadMetadata(placeId) {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAD_METADATA) || '{}');
      return all[placeId] || { status: 'Novo', tags: [], notes: '' };
    } catch {
      return { status: 'Novo', tags: [], notes: '' };
    }
  },

  updateLeadMetadata(placeId, updates) {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAD_METADATA) || '{}');
      const current = all[placeId] || { status: 'Novo', tags: [], notes: '' };
      all[placeId] = { ...current, ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.LEAD_METADATA, JSON.stringify(all));
      return all[placeId];
    } catch (e) {
      console.error('Failed to update lead metadata', e);
      return null;
    }
  },

  getAllLeadMetadata() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAD_METADATA) || '{}');
    } catch {
      return {};
    }
  },

  // Reset entire application data
  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.LISTS);
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.LEAD_METADATA);
  }
};
