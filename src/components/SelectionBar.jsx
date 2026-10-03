import React from 'react';
import { BookmarkPlus, Download, X, CheckSquare, Sparkles } from 'lucide-react';

export default function SelectionBar({
  selectedCount = 0,
  onClearSelection,
  onAddToList,
  onExport,
  onBatchEnrich
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="selection-context-bar" role="toolbar" aria-label="Ações de seleção">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
        <CheckSquare size={15} color="var(--lime-accent)" />
        <span className="tnum">{selectedCount} {selectedCount === 1 ? 'empresa selecionada' : 'empresas selecionadas'}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {onBatchEnrich && (
          <button className="btn btn-lime btn-sm" onClick={onBatchEnrich} title="Buscar WhatsApp, Instagram e Redes Sociais">
            <Sparkles size={13} />
            Enriquecer ({selectedCount})
          </button>
        )}

        <button className="btn btn-secondary btn-sm" onClick={onAddToList} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}>
          <BookmarkPlus size={13} />
          Salvar na lista
        </button>

        <button className="btn btn-secondary btn-sm" onClick={onExport} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}>
          <Download size={13} />
          Exportar
        </button>

        <button 
          className="btn-icon" 
          onClick={onClearSelection} 
          title="Remover seleção"
          style={{ color: '#FFFFFF', padding: '3px' }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
