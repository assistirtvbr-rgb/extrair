import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  FolderKanban, 
  ListOrdered, 
  Bookmark, 
  BarChart3, 
  History, 
  Settings, 
  Sparkles, 
  Download, 
  RotateCcw,
  Command,
  ArrowRight
} from 'lucide-react';

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onTriggerAction
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const actions = [
    { id: 'view_search', title: 'Explorar Empresas e Estabelecimentos', icon: Search, category: 'Navegação', run: () => onNavigate('search') },
    { id: 'view_pipeline', title: 'Abrir Pipeline de Leads (CRM Kanban)', icon: FolderKanban, category: 'Navegação', run: () => onNavigate('pipeline') },
    { id: 'view_lists', title: 'Ver Minhas Listas Comerciais', icon: ListOrdered, category: 'Navegação', run: () => onNavigate('lists') },
    { id: 'view_favorites', title: 'Ver Leads Favoritos', icon: Bookmark, category: 'Navegação', run: () => onNavigate('favorites') },
    { id: 'view_comparator', title: 'Comparador de Mercado por Região', icon: BarChart3, category: 'Navegação', run: () => onNavigate('comparator') },
    { id: 'view_history', title: 'Histórico de Consultas', icon: History, category: 'Navegação', run: () => onNavigate('history') },
    { id: 'view_settings', title: 'Configurações do Sistema', icon: Settings, category: 'Navegação', run: () => onNavigate('settings') },
    { id: 'act_enrich', title: 'Enriquecer Presença Digital dos Leads', icon: Sparkles, category: 'Ações Rápidas', run: () => onTriggerAction('enrich') },
    { id: 'act_export', title: 'Exportar Resultados (CSV / JSON)', icon: Download, category: 'Ações Rápidas', run: () => onTriggerAction('export') },
    { id: 'act_clear_filters', title: 'Limpar Todos os Filtros Ativos', icon: RotateCcw, category: 'Ações Rápidas', run: () => onTriggerAction('clear_filters') }
  ];

  const filtered = actions.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase()) || 
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].run();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ width: '560px', maxHeight: '420px', borderRadius: 'var(--radius-lg)' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={16} color="var(--text-secondary)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Digite um comando ou navegue..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '14px', outline: 'none' }}
          />
          <span style={{ fontSize: '10px', background: 'var(--bg-subtle)', padding: '2px 5px', borderRadius: '4px', color: 'var(--text-muted)' }}>
            ESC para fechar
          </span>
        </div>

        <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '6px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Nenhum comando encontrado para "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--green-subtle)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: isSelected ? 'var(--green-dark)' : 'var(--text-secondary)' }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: isSelected ? '600' : '500', color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.category}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <ArrowRight size={14} color="var(--green-dark)" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
