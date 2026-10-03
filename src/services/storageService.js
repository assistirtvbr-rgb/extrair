/**
 * LeadMap Persistent Storage Service (v2)
 * Manages unified lead records across Lists, Favorites, Pipeline, Notes, and Digital Presence.
 */

const STORAGE_KEYS = {
  SCHEMA_VERSION: 'leadmap_schema_version',
  LEADS_V2: 'leadmap_leads_v2',
  LISTS: 'leadmap_lists_v2',
  HISTORY: 'leadmap_history_v2',
  SETTINGS: 'leadmap_settings_v2',
  // Legacy keys for migration
  LEGACY_LISTS: 'leadmap_lists',
  LEGACY_FAVORITES: 'leadmap_favorites',
  LEGACY_LEAD_METADATA: 'leadmap_lead_metadata',
  LEGACY_SETTINGS: 'leadmap_settings',
  LEGACY_HISTORY: 'leadmap_history'
};

const CURRENT_SCHEMA_VERSION = 2;

const DEFAULT_SETTINGS = {
  workerApiUrl: '/api/search',
  defaultRadiusKm: 5,
  defaultSort: 'distance',
  autoSaveHistory: true,
  splitRatio: 46, // list 46% / map 54%
  demoMode: false, // Default to Live Real Data (OpenStreetMap / Google Places)
  tableColumns: {
    name: true,
    category: true,
    score: true,
    phone: true,
    digitalPresence: true,
    rating: true,
    reviews: true,
    distance: true,
    crmStatus: true,
    nextAction: true
  }
};

/**
 * Migration helper from v1 storage layout to unified v2 schema
 */
function runMigrations() {
  try {
    const version = parseInt(localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION) || '1', 10);
    if (version < CURRENT_SCHEMA_VERSION) {
      const leadsV2 = {};

      // Migrate legacy lead metadata
      const legacyMeta = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEGACY_LEAD_METADATA) || '{}');
      Object.entries(legacyMeta).forEach(([placeId, meta]) => {
        leadsV2[placeId] = {
          placeId,
          status: meta.status || 'Novo',
          tags: meta.tags || [],
          notes: meta.notes || '',
          nextAction: meta.nextAction || '',
          returnDate: meta.returnDate || null,
          priority: meta.priority || 'Média',
          lossReason: meta.lossReason || '',
          activityLog: meta.activityLog || [],
          digitalPresence: meta.digitalPresence || {},
          isFavorite: false,
          updatedAt: meta.updatedAt || new Date().toISOString()
        };
      });

      // Migrate legacy favorites
      const legacyFavs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEGACY_FAVORITES) || '[]');
      legacyFavs.forEach(fav => {
        const id = fav.id || fav.place_id;
        if (id) {
          if (!leadsV2[id]) {
            leadsV2[id] = {
              placeId: id,
              status: 'Novo',
              tags: [],
              notes: '',
              nextAction: '',
              returnDate: null,
              priority: 'Média',
              activityLog: [],
              digitalPresence: {},
              cachedData: fav,
              isFavorite: true,
              updatedAt: new Date().toISOString()
            };
          } else {
            leadsV2[id].isFavorite = true;
            leadsV2[id].cachedData = fav;
          }
        }
      });

      // Save unified leads
      localStorage.setItem(STORAGE_KEYS.LEADS_V2, JSON.stringify(leadsV2));

      // Migrate legacy lists
      const legacyLists = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEGACY_LISTS) || '[]');
      if (legacyLists.length > 0) {
        localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(legacyLists));
      }

      // Mark migration complete
      localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, String(CURRENT_SCHEMA_VERSION));
    }
  } catch (err) {
    console.warn('Storage migration warning:', err);
  }
}

// Run migrations on module load
if (typeof window !== 'undefined') {
  runMigrations();
}

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
      console.error('Failed to save settings', e);
    }
  },

  // Unified Leads Store (Pipeline, Tags, Notes, Next Action, Activity Log)
  getAllLeads() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEADS_V2);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  getLead(placeId) {
    if (!placeId) return null;
    const all = this.getAllLeads();
    return all[placeId] || {
      placeId,
      status: 'Novo',
      tags: [],
      notes: '',
      nextAction: '',
      returnDate: null,
      priority: 'Média',
      lossReason: '',
      activityLog: [],
      digitalPresence: {},
      isFavorite: false
    };
  },

  updateLead(placeId, updates = {}, placeData = null) {
    if (!placeId) return null;
    try {
      const all = this.getAllLeads();
      const current = all[placeId] || {
        placeId,
        status: 'Novo',
        tags: [],
        notes: '',
        nextAction: '',
        returnDate: null,
        priority: 'Média',
        lossReason: '',
        activityLog: [],
        digitalPresence: {},
        isFavorite: false
      };

      const merged = {
        ...current,
        ...updates,
        placeId,
        updatedAt: new Date().toISOString()
      };

      if (placeData) {
        merged.cachedData = {
          ...(current.cachedData || {}),
          ...placeData
        };
      }

      all[placeId] = merged;
      localStorage.setItem(STORAGE_KEYS.LEADS_V2, JSON.stringify(all));
      return merged;
    } catch (e) {
      console.error('Failed to update lead', e);
      return null;
    }
  },

  addLeadActivity(placeId, activityDescription, type = 'note') {
    if (!placeId || !activityDescription) return;
    const lead = this.getLead(placeId);
    const newActivity = {
      id: 'act_' + Date.now(),
      timestamp: new Date().toISOString(),
      type,
      description: activityDescription.trim()
    };
    const log = [newActivity, ...(lead.activityLog || [])];
    return this.updateLead(placeId, { activityLog: log.slice(0, 50) });
  },

  // Favorites
  getFavorites() {
    const all = this.getAllLeads();
    return Object.values(all)
      .filter(lead => lead.isFavorite)
      .map(lead => lead.cachedData || { id: lead.placeId, name: 'Lead Favorito' });
  },

  isFavorite(placeId) {
    if (!placeId) return false;
    const lead = this.getLead(placeId);
    return Boolean(lead?.isFavorite);
  },

  toggleFavorite(place) {
    const placeId = place.id || place.place_id;
    if (!placeId) return false;
    const current = this.getLead(placeId);
    const newFavStatus = !current.isFavorite;
    
    this.updateLead(placeId, { isFavorite: newFavStatus }, place);
    return newFavStatus;
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
        places
      };
      lists.unshift(newList);
      localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));

      // Cache places in leads store
      places.forEach(p => {
        const id = p.id || p.place_id;
        if (id) {
          this.updateLead(id, {}, p);
        }
      });

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
          this.updateLead(id, {}, p);
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
      if (history.length > 40) history.pop();
      
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

  // Full Backup & Restore
  exportBackupJSON() {
    const backup = {
      version: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      leads: this.getAllLeads(),
      lists: this.getLists(),
      history: this.getHistory(),
      settings: this.getSettings()
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackupJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        throw new Error('Formato JSON inválido.');
      }

      if (data.leads && typeof data.leads === 'object') {
        localStorage.setItem(STORAGE_KEYS.LEADS_V2, JSON.stringify(data.leads));
      }
      if (Array.isArray(data.lists)) {
        localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(data.lists));
      }
      if (Array.isArray(data.history)) {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
      }
      if (data.settings && typeof data.settings === 'object') {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      }
      return true;
    } catch (err) {
      console.error('Falha ao restaurar backup:', err);
      throw err;
    }
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.LEADS_V2);
    localStorage.removeItem(STORAGE_KEYS.LISTS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
};
