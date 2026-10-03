import React, { useState } from 'react';
import { X, BookmarkPlus, Plus, Check } from 'lucide-react';
import { storageService } from '../services/storageService';

export default function AddToListModal({
  isOpen,
  onClose,
  places = [],
  onListUpdated
}) {
  const [listName, setListName] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [mode, setMode] = useState('new'); // 'new' or 'existing'
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const lists = storageService.getLists();
  const total = places.length;

  const handleSave = (e) => {
    e.preventDefault();
    if (mode === 'new') {
      if (!listName.trim()) return;
      storageService.saveList(listName.trim(), places);
    } else {
      if (!selectedListId) return;
      storageService.addPlacesToList(selectedListId, places);
    }

    setIsSuccess(true);
    if (onListUpdated) onListUpdated();

    setTimeout(() => {
      setIsSuccess(false);
      setListName('');
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: '460px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Adicionar {total} {total === 1 ? 'empresa' : 'empresas'} a uma lista</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            {lists.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  className={`radius-chip ${mode === 'new' ? 'active' : ''}`}
                  onClick={() => setMode('new')}
                  style={{ flex: 1, padding: '8px', textAlign: 'center' }}
                >
                  + Criar nova lista
                </button>
                <button
                  type="button"
                  className={`radius-chip ${mode === 'existing' ? 'active' : ''}`}
                  onClick={() => {
                    setMode('existing');
                    if (lists.length > 0 && !selectedListId) {
                      setSelectedListId(lists[0].id);
                    }
                  }}
                  style={{ flex: 1, padding: '8px', textAlign: 'center' }}
                >
                  Adicionar a lista existente
                </button>
              </div>
            )}

            {mode === 'new' ? (
              <div className="filter-group">
                <label className="filter-label">Nome da nova lista de prospecção</label>
                <input
                  type="text"
                  placeholder="Ex: Clínicas Odontológicas Tijuca"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  autoFocus
                  required
                  style={{ padding: '9px 12px', fontSize: '14px' }}
                />
              </div>
            ) : (
              <div className="filter-group">
                <label className="filter-label">Selecione a lista de destino</label>
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  style={{ padding: '9px 12px', fontSize: '14px' }}
                >
                  {lists.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.places?.length || 0} empresas)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isSuccess || (mode === 'new' ? !listName.trim() : !selectedListId)}
            >
              {isSuccess ? (
                <>
                  <Check size={14} /> Salvo com sucesso!
                </>
              ) : (
                <>
                  <BookmarkPlus size={14} /> Salvar empresas
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
