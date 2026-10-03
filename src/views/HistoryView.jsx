import React, { useState } from 'react';
import { History, Play, Trash2, MapPin, Search } from 'lucide-react';
import { storageService } from '../services/storageService';
import { formatDate } from '../utils/formatter';

export default function HistoryView({
  onReplaySearch
}) {
  const [history, setHistory] = useState(storageService.getHistory());

  const handleClear = () => {
    if (window.confirm('Deseja limpar todo o histórico de buscas?')) {
      storageService.clearHistory();
      setHistory([]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'var(--bg-main)' }}>
      <div style={{ padding: '16px 24px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Histórico de Consultas</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Clique em qualquer consulta para executá-la novamente instantaneamente
          </p>
        </div>

        {history.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={handleClear} style={{ color: 'var(--alert-color)' }}>
            <Trash2 size={14} />
            Limpar histórico
          </button>
        )}
      </div>

      <div className="table-container">
        {history.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-state-icon">
              <History size={26} />
            </div>
            <h3 className="empty-state-title">Nenhum histórico recente</h3>
            <p className="empty-state-desc">
              Suas pesquisas recentes serão salvas aqui para fácil repetição.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Termo Pesquisado</th>
                <th>Localização</th>
                <th>Raio</th>
                <th>Resultados</th>
                <th>Data / Hora</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr 
                  key={item.id}
                  onClick={() => onReplaySearch(item.query, item.locationName, item.radiusKm, item.lat, item.lng)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: '600', color: 'var(--green-dark)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Search size={14} color="var(--green-accent)" />
                      {item.query}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="var(--text-secondary)" />
                      {item.locationName}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{item.radiusKm} km</span>
                  </td>
                  <td>
                    <span className="badge badge-green">{item.resultsCount} empresas</span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {formatDate(item.createdAt)}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReplaySearch(item.query, item.locationName, item.radiusKm, item.lat, item.lng);
                      }}
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      <Play size={11} /> Executar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
