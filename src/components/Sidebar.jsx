import React, { useState } from 'react';
import { 
  Search, 
  ListOrdered, 
  FolderKanban, 
  Bookmark, 
  BarChart3, 
  History, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
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
        {/* Header with Custom Location & Connection SVG Logo */}
        <div className="sidebar-header">
          <div 
            className="sidebar-logo" 
            onClick={() => setCurrentView('search')}
            title="LeadMap — Inteligência Comercial & Prospecção"
          >
            <div className="sidebar-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
                <circle cx="4" cy="5" r="1.5" fill="currentColor" />
                <circle cx="20" cy="5" r="1.5" fill="currentColor" />
                <line x1="5.5" y1="5.5" x2="9.5" y2="7.5" strokeDasharray="1.5 1.5" />
                <line x1="18.5" y1="5.5" x2="14.5" y2="7.5" strokeDasharray="1.5 1.5" />
              </svg>
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
            {isCompact ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
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
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
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
          title={isDemoMode ? "Modo Demonstração Ativo (Clique para alternar para Live Mode)" : "Modo Produção Live Conectado (OpenStreetMap / Google Places)"}
        >
          <div className={`status-dot ${isDemoMode ? '' : 'live'}`} />
          {!isCompact && (
            <span>{isDemoMode ? 'Modo Demo' : 'Modo Live'}</span>
          )}
        </div>
      </div>
    </aside>
  );
}
