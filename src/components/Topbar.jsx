import React from 'react';
import { 
  Download, 
  BookmarkPlus, 
  Columns2, 
  List, 
  Map as MapIcon, 
  Table as TableIcon,
  Sparkles,
  Command
} from 'lucide-react';

export default function Topbar({ 
  currentView, 
  viewMode, 
  setViewMode, 
  totalResults = 0,
  onOpenExport,
  onOpenSaveList,
  onOpenBatchEnrich,
  onOpenCommandPalette
}) {
  const getTitles = () => {
    switch (currentView) {
      case 'pipeline':
        return { title: 'Pipeline CRM', subtitle: 'Acompanhe leads, etapas comerciais e datas de retorno' };
      case 'lists':
        return { title: 'Minhas Listas', subtitle: 'Segmentações e carteiras de prospecção salvas' };
      case 'favorites':
        return { title: 'Leads Favoritos', subtitle: 'Estabelecimentos marcados com estrela para abordagem prioritária' };
      case 'comparator':
        return { title: 'Comparador de Regiões', subtitle: 'Análise de densidade e oportunidades entre bairros e cidades' };
      case 'history':
        return { title: 'Histórico de Consultas', subtitle: 'Reexecute buscas anteriores com um único clique' };
      case 'settings':
        return { title: 'Configurações', subtitle: 'Parâmetros de geolocalização, conexão de dados e armazenamento' };
      default:
        return { title: 'Explorar Empresas', subtitle: 'Pesquisa e prospecção de estabelecimentos comerciais' };
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
              <span className="badge badge-brand tnum" style={{ fontSize: '13px', padding: '2px 8px' }}>
                {totalResults} {totalResults === 1 ? 'empresa' : 'empresas'}
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
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-hover)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginRight: '6px' }}>
              <button
                type="button"
                className={`btn btn-ghost btn-sm ${viewMode === 'split' ? 'active' : ''}`}
                onClick={() => setViewMode('split')}
                title="Visualização dividida: Lista e Mapa"
                style={{ padding: '6px 10px', background: viewMode === 'split' ? '#FFFFFF' : 'transparent', boxShadow: viewMode === 'split' ? 'var(--shadow-xs)' : 'none' }}
              >
                <Columns2 size={15} color={viewMode === 'split' ? 'var(--brand-primary)' : 'currentColor'} />
              </button>
              <button
                type="button"
                className={`btn btn-ghost btn-sm ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Visualização somente Lista"
                style={{ padding: '6px 10px', background: viewMode === 'list' ? '#FFFFFF' : 'transparent', boxShadow: viewMode === 'list' ? 'var(--shadow-xs)' : 'none' }}
              >
                <List size={15} color={viewMode === 'list' ? 'var(--brand-primary)' : 'currentColor'} />
              </button>
              <button
                type="button"
                className={`btn btn-ghost btn-sm ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
                title="Visualização somente Mapa"
                style={{ padding: '6px 10px', background: viewMode === 'map' ? '#FFFFFF' : 'transparent', boxShadow: viewMode === 'map' ? 'var(--shadow-xs)' : 'none' }}
              >
                <MapIcon size={15} color={viewMode === 'map' ? 'var(--brand-primary)' : 'currentColor'} />
              </button>
              <button
                type="button"
                className={`btn btn-ghost btn-sm ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Visualização em Tabela Completa"
                style={{ padding: '6px 10px', background: viewMode === 'table' ? '#FFFFFF' : 'transparent', boxShadow: viewMode === 'table' ? 'var(--shadow-xs)' : 'none' }}
              >
                <TableIcon size={15} color={viewMode === 'table' ? 'var(--brand-primary)' : 'currentColor'} />
              </button>
            </div>

            {totalResults > 0 && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenBatchEnrich}
                  title="Enriquecer redes sociais e WhatsApp em lote"
                  style={{ height: '36px' }}
                >
                  <Sparkles size={14} color="#D946EF" />
                  <span>Enriquecer</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenSaveList}
                  title="Salvar resultados como nova lista"
                  style={{ height: '36px' }}
                >
                  <BookmarkPlus size={14} />
                  <span>Salvar Lista</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenExport}
                  title="Exportar para CSV ou JSON"
                  style={{ height: '36px' }}
                >
                  <Download size={14} />
                  <span>Exportar</span>
                </button>
              </>
            )}
          </>
        )}

        {/* Command Palette Trigger */}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onOpenCommandPalette}
          title="Abrir paleta de comandos rápidos (Ctrl + K / ⌘ + K)"
          style={{ gap: '5px', fontSize: '12px', color: 'var(--text-secondary)', padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-hover)' }}
        >
          <Command size={13} />
          <span style={{ fontWeight: '700' }}>K</span>
        </button>
      </div>
    </header>
  );
}
