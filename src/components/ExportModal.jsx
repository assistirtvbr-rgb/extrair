import React, { useState } from 'react';
import { X, Download, Copy, Check, FileSpreadsheet, FileJson, ClipboardCopy } from 'lucide-react';
import { exportToCSV, exportToJSON, copyToClipboard } from '../utils/csv';

export default function ExportModal({
  isOpen,
  onClose,
  places = []
}) {
  const [format, setFormat] = useState('csv'); // 'csv', 'json', 'clipboard'
  const [copied, setCopied] = useState(false);
  
  const [fields, setFields] = useState({
    name: true,
    phone: true,
    website: true,
    address: true,
    rating: true,
    userRatingCount: true,
    distance: true,
    primaryType: true,
    latitude: true,
    longitude: true,
    place_id: true
  });

  if (!isOpen) return null;

  const total = places.length;

  const handleFieldToggle = (key) => {
    setFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAllFields = () => {
    const allSelected = Object.values(fields).every(Boolean);
    const updated = {};
    Object.keys(fields).forEach(k => {
      updated[k] = !allSelected;
    });
    setFields(updated);
  };

  const handleExecuteExport = async () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `leadmap-export-${timestamp}`;

    if (format === 'csv') {
      exportToCSV(places, fields, `${filename}.csv`);
      onClose();
    } else if (format === 'json') {
      exportToJSON(places, `${filename}.json`);
      onClose();
    } else if (format === 'clipboard') {
      const ok = await copyToClipboard(places);
      if (ok) {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          onClose();
        }, 1500);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Exportar {total} {total === 1 ? 'empresa' : 'empresas'}</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Format selection */}
          <div className="filter-group">
            <label className="filter-label">Formato do Arquivo / Saída</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                type="button"
                className={`filter-pill ${format === 'csv' ? 'active' : ''}`}
                onClick={() => setFormat('csv')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px' }}
              >
                <FileSpreadsheet size={20} />
                <span style={{ fontWeight: '600', fontSize: '13px' }}>CSV (Excel)</span>
              </button>

              <button
                type="button"
                className={`filter-pill ${format === 'json' ? 'active' : ''}`}
                onClick={() => setFormat('json')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px' }}
              >
                <FileJson size={20} />
                <span style={{ fontWeight: '600', fontSize: '13px' }}>JSON</span>
              </button>

              <button
                type="button"
                className={`filter-pill ${format === 'clipboard' ? 'active' : ''}`}
                onClick={() => setFormat('clipboard')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px' }}
              >
                <ClipboardCopy size={20} />
                <span style={{ fontWeight: '600', fontSize: '13px' }}>Copiar Texto</span>
              </button>
            </div>
          </div>

          {/* Field selection checkboxes (for CSV) */}
          {format === 'csv' && (
            <div className="filter-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="filter-label">Campos a incluir na planilha</label>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={handleSelectAllFields}
                  style={{ fontSize: '11px', color: 'var(--green-accent)' }}
                >
                  Alternar todos
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[
                  { key: 'name', label: 'Nome da Empresa' },
                  { key: 'phone', label: 'Telefone' },
                  { key: 'website', label: 'Website' },
                  { key: 'address', label: 'Endereço Completo' },
                  { key: 'rating', label: 'Avaliação (Estrelas)' },
                  { key: 'userRatingCount', label: 'Total de Reviews' },
                  { key: 'distance', label: 'Distância (km)' },
                  { key: 'primaryType', label: 'Categoria Comercial' },
                  { key: 'latitude', label: 'Latitude' },
                  { key: 'longitude', label: 'Longitude' },
                  { key: 'place_id', label: 'Google Place ID' }
                ].map(item => (
                  <label key={item.key} className="filter-checkbox-row">
                    <input
                      type="checkbox"
                      checked={Boolean(fields[item.key])}
                      onChange={() => handleFieldToggle(item.key)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            ℹ️ A exportação é processada instantaneamente de forma segura no seu próprio navegador, pronta para importação no seu CRM ou planilha de prospecção.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancelar
          </button>
          
          <button className="btn btn-primary btn-sm" onClick={handleExecuteExport}>
            {copied ? (
              <>
                <Check size={14} />
                Copiado com sucesso!
              </>
            ) : format === 'clipboard' ? (
              <>
                <Copy size={14} />
                Copiar para Área de Transferência
              </>
            ) : (
              <>
                <Download size={14} />
                Exportar arquivo ({format.toUpperCase()})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
