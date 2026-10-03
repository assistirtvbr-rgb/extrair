import React from 'react';
import { BookmarkPlus, Download, X, CheckSquare } from 'lucide-react';

export default function SelectionBar({
  selectedCount = 0,
  onClearSelection,
  onAddToList,
  onExport
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="selection-context-bar" role="toolbar" aria-label="Ações de seleção">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
        <CheckSquare size={16} />
        <span>{selectedCount} {selectedCount === 1 ? 'empresa selecionada' : 'empresas selecionadas'}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="btn btn-light btn-sm" onClick={onAddToList}>
          <BookmarkPlus size={14} />
          Adicionar à lista
        </button>

        <button className="btn btn-light btn-sm" onClick={onExport}>
          <Download size={14} />
          Exportar
        </button>

        <button 
          className="btn-icon" 
          onClick={onClearSelection} 
          title="Remover seleção"
          style={{ color: '#FFFFFF', padding: '4px' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
