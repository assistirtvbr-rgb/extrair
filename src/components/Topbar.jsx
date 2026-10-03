import React from 'react';
import { 
  Download, 
  BookmarkPlus, 
  Columns2, 
  List, 
  Map as MapIcon, 
  SlidersHorizontal,
  Command
} from 'lucide-react';

export default function Topbar({ 
  currentView, 
  viewMode, 
  setViewMode, 
  totalResults = 0,
  onOpenExport,
  onOpenSaveList,
  onOpenFilters
}) {
  const getTitles = () => {
    switch (currentView) {
      case 'lists':
        return { title: 'Minhas Listas Comerciais', subtitle: 'Listas segmentadas e gerenciamento de leads' };
      case 'favorites':
        return { title: 'Empresas Favoritas', subtitle: 'Estabelecimentos marcados com estrela' };
      case 'comparator':
        return { title: 'Comparador de Mercado por Região', subtitle: 'Inteligência e densidade comercial comparada' };
      case 'history':
        return { title: 'Histórico de Pesquisas', subtitle: 'Consultas recentes e reexecução rápida' };
      case 'settings':
        return { title: 'Configurações do LeadMap', subtitle: 'Parâmetros de API, mapa e armazenamento local' };
      default:
        return { title: 'Pesquisa de Empresas', subtitle: 'Mapeamento de estabelecimentos via Google Places API' };
    }
  };

  const { title, subtitle } = getTitles();

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <div>
          <h1 className="topbar-title">
            {title}
            {currentView === 'search' && totalResults > 0 && (
              <span className="badge badge-green">
                {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'}
              </span>
            )}
          </h1>
          <p className="topbar-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        {currentView === 'search' && (
          <>
            {/* View Layout Switcher */}
            <div className="radius-selector" style={{ padding: '2px', marginRight: '6px' }}>
              <button
                className={`radius-chip ${viewMode === 'split' ? 'active' : ''}`}
                onClick={() => setViewMode('split')}
                title="Dividir tela (Lista + Mapa)"
              >
                <Columns2 size={15} />
              </button>
              <button
                className={`radius-chip ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Somente Lista"
              >
                <List size={15} />
              </button>
              <button
                className={`radius-chip ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
                title="Somente Mapa"
              >
                <MapIcon size={15} />
              </button>
            </div>

            {totalResults > 0 && (
              <>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenSaveList}
                  title="Salvar resultados como uma nova lista de prospecção"
                >
                  <BookmarkPlus size={14} />
                  Salvar lista
                </button>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={onOpenExport}
                  title="Exportar dados (CSV, JSON ou Área de transferência)"
                >
                  <Download size={14} />
                  Exportar
                </button>
              </>
            )}
          </>
        )}

        <div className="badge badge-neutral" style={{ gap: '4px', fontSize: '11px', cursor: 'default' }} title="Pressione Ctrl+K para buscar rapidamente">
          <Command size={11} /> K
        </div>
      </div>
    </header>
  );
}
