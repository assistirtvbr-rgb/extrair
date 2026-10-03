import React from 'react';
import { 
  Search, 
  ListOrdered, 
  Bookmark, 
  History, 
  BarChart3, 
  Settings, 
  Compass, 
  Zap, 
  Layers 
} from 'lucide-react';

export default function Sidebar({ 
  currentView, 
  setCurrentView, 
  listsCount = 0, 
  favoritesCount = 0,
  isMockApi = false 
}) {
  const navItems = [
    { id: 'search', label: 'Pesquisa de Empresas', icon: Search, badge: null },
    { id: 'lists', label: 'Minhas Listas', icon: ListOrdered, badge: listsCount > 0 ? listsCount : null },
    { id: 'favorites', label: 'Favoritos', icon: Bookmark, badge: favoritesCount > 0 ? favoritesCount : null },
    { id: 'comparator', label: 'Comparador de Regiões', icon: BarChart3, badge: null },
    { id: 'history', label: 'Histórico de Pesquisas', icon: History, badge: null },
    { id: 'settings', label: 'Configurações', icon: Settings, badge: null }
  ];

  return (
    <aside className="app-sidebar" aria-label="Navegação Principal">
      <div 
        className="sidebar-logo" 
        onClick={() => setCurrentView('search')}
        title="LeadMap — Inteligência Comercial"
      >
        <div className="sidebar-logo-icon">
          <Compass size={22} strokeWidth={2.2} />
        </div>
      </div>

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
              title={item.label}
            >
              <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
              {item.badge !== null && (
                <span className="nav-badge">{item.badge}</span>
              )}
              <span className="tooltip">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div 
          className={`api-status-pill ${isMockApi ? 'mock' : ''}`} 
          title={isMockApi ? 'Modo Demonstração Ativo (Local)' : 'Cloudflare Worker Conectado'}
        />
        <div className="user-avatar" title="Perfil Comercial (LeadMap Pro)">
          LM
        </div>
      </div>
    </aside>
  );
}
