import React from 'react';
import { 
  Download, 
  BookmarkPlus, 
  Columns2, 
  List, 
  Map as MapIcon, 
  Table as TableIcon,
  Sparkles,
  Command,
  HelpCircle
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
        return { title: 'Pipeline de Prospecção', subtitle: 'Acompanhamento de oportunidades, retornos e status comercial' };
      case 'lists':
        return { title: 'Minhas Listas Comerciais', subtitle: 'Segmentações de mercado e exportações salvas' };
      case 'favorites':
        return { title: 'Leads Favoritos', subtitle: 'Estabelecimentos marcados com estrela para abordagem' };
      case 'comparator':
        return { title: 'Comparador de Regiões', subtitle: 'Amostra comparativa e densidade comercial por bairro ou cidade' };
      case 'history':
        return { title: 'Histórico de Consultas', subtitle: 'Consultas anteriores com reexecução em 1 clique' };
      case 'settings':
        return { title: 'Configurações do LeadMap', subtitle: 'Credenciais da API, parâmetros de raio e backup local' };
      default:
        return { title: 'Explorar Estabelecimentos', subtitle: 'Estação de trabalho de prospecção e inteligência local' };
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
              <span className="badge badge-green tnum">
                {totalResults} {totalResults === 1 ? 'carregado' : 'carregados'}
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
            <div className="radius-selector" style={{ padding: '2px', marginRight: '4px' }}>
              <button
                className={`radius-chip ${viewMode === 'split' ? 'active' : ''}`}
                onClick={() => setViewMode('split')}
                title="Dividir tela: Lista + Mapa"
              >
                <Columns2 size={14} />
              </button>
              <button
                className={`radius-chip ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Visualização somente Lista"
              >
                <List size={14} />
              </button>
              <button
                className={`radius-chip ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
                title="Visualização somente Mapa"
              >
                <MapIcon size={14} />
              </button>
              <button
                className={`radius-chip ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Visualização em Tabela Avançada"
              >
                <TableIcon size={14} />
              </button>
            </div>

            {totalResults > 0 && (
              <>
                <button
                  className="btn btn-lime btn-sm"
                  onClick={onOpenBatchEnrich}
                  title="Enriquecer redes sociais e WhatsApp dos leads visíveis"
                >
                  <Sparkles size={13} />
                  Enriquecer
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenSaveList}
                  title="Salvar resultados como nova lista"
                >
                  <BookmarkPlus size={13} />
                  Salvar lista
                </button>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={onOpenExport}
                  title="Exportar para CSV ou JSON"
                >
                  <Download size={13} />
                  Exportar
                </button>
              </>
            )}
          </>
        )}

        {/* Command Palette trigger */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={onOpenCommandPalette}
          title="Abrir paleta de comandos (Ctrl + K / ⌘ + K)"
          style={{ gap: '4px', fontSize: '11.5px', color: 'var(--text-secondary)' }}
        >
          <Command size={12} />
          <span style={{ fontWeight: '600' }}>K</span>
        </button>
      </div>
    </header>
  );
}
