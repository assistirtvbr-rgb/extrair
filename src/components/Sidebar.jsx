import React, { useState } from 'react';
import { 
  Search, 
  ListOrdered, 
  FolderKanban, 
  Bookmark, 
  BarChart3, 
  History, 
  Settings, 
  Compass, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function Sidebar({
  currentView,
  setCurrentView,
  listsCount = 0,
  favoritesCount = 0,
  isDemoMode = true,
  onToggleDemoMode
}) {
  const [isCompact, setIsCompact] = useState(false);

  const navItems = [
    { id: 'search', label: 'Explorar', icon: Search, badge: null },
    { id: 'lists', label: 'Minhas Listas', icon: ListOrdered, badge: listsCount > 0 ? listsCount : null },
    { id: 'pipeline', label: 'Pipeline CRM', icon: FolderKanban, badge: null },
    { id: 'favorites', label: 'Favoritos', icon: Bookmark, badge: favoritesCount > 0 ? favoritesCount : null },
    { id: 'comparator', label: 'Comparar Regiões', icon: BarChart3, badge: null },
    { id: 'history', label: 'Histórico', icon: History, badge: null },
    { id: 'settings', label: 'Configurações', icon: Settings, badge: null }
  ];

  return (
    <aside className={`app-sidebar ${isCompact ? 'compact' : ''}`} aria-label="Navegação Principal">
      <div>
        {/* Header with Logo and Collapse button */}
        <div className="sidebar-header">
          <div 
            className="sidebar-logo" 
            onClick={() => setCurrentView('search')}
            title="LeadMap — Inteligência Comercial"
          >
            <div className="sidebar-logo-icon">
              <Compass size={18} strokeWidth={2.4} />
            </div>
            {!isCompact && (
              <span className="sidebar-logo-text">LeadMap</span>
            )}
          </div>

          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setIsCompact(!isCompact)}
            title={isCompact ? "Expandir barra lateral" : "Recolher barra lateral"}
            aria-label="Alternar tamanho da barra lateral"
          >
            {isCompact ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentView(item.id)}
                aria-label={item.label}
              >
                <div className="nav-item-icon">
                  <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />
                </div>
                
                {!isCompact && (
                  <span className="nav-item-label">{item.label}</span>
                )}

                {item.badge !== null && (
                  <span className="nav-badge">{item.badge}</span>
                )}

                {isCompact && (
                  <span className="tooltip">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Mode Indicator */}
      <div className="sidebar-footer">
        <div 
          className="mode-badge-pill"
          onClick={onToggleDemoMode}
          style={{ cursor: 'pointer' }}
          title={isDemoMode ? "Modo Demonstração Ativo (Clique para alternar para Live Mode)" : "Modo Produção Live Google Places Ativo"}
        >
          <div className={`status-dot ${isDemoMode ? '' : 'live'}`} />
          {!isCompact && (
            <span>{isDemoMode ? 'Modo Demo' : 'Google Places'}</span>
          )}
        </div>
      </div>
    </aside>
  );
}
