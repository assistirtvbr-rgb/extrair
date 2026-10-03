import React, { useState } from 'react';
import { Settings, ShieldCheck, Database, Save, RotateCcw, Check, Key, Server, Cpu } from 'lucide-react';
import { storageService } from '../services/storageService';

export default function SettingsView({ onDataReset }) {
  const [settings, setSettings] = useState(storageService.getSettings());
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    storageService.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Limpar todo o histórico de pesquisas?')) {
      storageService.clearHistory();
      if (onDataReset) onDataReset();
      alert('Histórico limpo com sucesso!');
    }
  };

  const handleClearFavorites = () => {
    if (window.confirm('Remover todas as empresas dos favoritos?')) {
      localStorage.removeItem('leadmap_favorites');
      if (onDataReset) onDataReset();
      alert('Favoritos removidos com sucesso!');
    }
  };

  const handleClearLists = () => {
    if (window.confirm('Excluir todas as listas salvas? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem('leadmap_lists');
      if (onDataReset) onDataReset();
      alert('Listas excluídas com sucesso!');
    }
  };

  const handleResetAll = () => {
    if (window.confirm('ATENÇÃO: Deseja restaurar a aplicação para o estado de fábrica? Todos os dados locais serão apagados.')) {
      storageService.clearAllData();
      if (onDataReset) onDataReset();
      alert('Aplicação restaurada com sucesso!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg-main)', padding: '24px' }}>
      <div style={{ maxWidth: '780px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Backend & Security Card */}
        <div className="filters-panel" style={{ width: '100%', borderRadius: 'var(--radius-md)' }}>
          <div className="filters-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="var(--green-accent)" />
              <h2 style={{ fontSize: '15px', fontWeight: '700' }}>Configuração do Cloudflare Worker & API</h2>
            </div>
            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> API Key Protegida
            </span>
          </div>

          <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="filter-group">
              <label className="filter-label">URL do Endpoint Cloudflare Worker (Proxy)</label>
              <input
                type="url"
                value={settings.workerApiUrl}
                onChange={(e) => setSettings({ ...settings, workerApiUrl: e.target.value })}
                placeholder="http://localhost:8787/api/search ou https://worker.seudominio.workers.dev/api/search"
                style={{ padding: '9px 12px' }}
                required
              />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Todas as chamadas para a Google Places API (New) são roteadas por este worker seguro sem expor a chave no cliente.
              </span>
            </div>

            <div className="filter-group">
              <label className="filter-label">Raio Padrão Inicial de Pesquisa</label>
              <select
                value={settings.defaultRadiusKm}
                onChange={(e) => setSettings({ ...settings, defaultRadiusKm: parseFloat(e.target.value) })}
                style={{ padding: '8px 12px' }}
              >
                <option value={1}>1 km (Ultra local / a pé)</option>
                <option value={3}>3 km (Bairro e adjacências)</option>
                <option value={5}>5 km (Raio comercial padrão)</option>
                <option value={10}>10 km (Região metropolitana)</option>
                <option value={25}>25 km (Cidade inteira)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                {saved ? <Check size={14} /> : <Save size={14} />}
                {saved ? 'Configurações Salvas!' : 'Salvar Parâmetros'}
              </button>
            </div>
          </form>
        </div>

        {/* Local Storage & Data Management */}
        <div className="filters-panel" style={{ width: '100%', borderRadius: 'var(--radius-md)' }}>
          <div className="filters-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="var(--green-accent)" />
              <h2 style={{ fontSize: '15px', fontWeight: '700' }}>Armazenamento Local & Privacidade</h2>
            </div>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Seus dados de prospecção, listas salvas, tags de leads e notas são armazenados de forma privada no armazenamento do seu próprio navegador (LocalStorage).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '6px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleClearHistory}>
                Limpar Histórico de Buscas
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleClearFavorites}>
                Limpar Favoritos
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleClearLists}>
                Excluir Todas as Listas
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={handleResetAll}
                style={{ color: 'var(--alert-color)', borderColor: '#FCA5A5' }}
              >
                Resetar Toda a Aplicação
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts */}
        <div className="filters-panel" style={{ width: '100%', borderRadius: 'var(--radius-md)' }}>
          <div className="filters-panel-header">
            <h2 style={{ fontSize: '15px', fontWeight: '700' }}>Atalhos de Teclado</h2>
          </div>

          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="detail-item-row">
              <span className="detail-item-label">Focar campo de pesquisa:</span>
              <kbd style={{ background: 'var(--bg-subtle)', padding: '3px 8px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                Ctrl + K / ⌘ + K
              </kbd>
            </div>

            <div className="detail-item-row">
              <span className="detail-item-label">Fechar gaveta de detalhes ou filtros:</span>
              <kbd style={{ background: 'var(--bg-subtle)', padding: '3px 8px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                Esc
              </kbd>
            </div>

            <div className="detail-item-row">
              <span className="detail-item-label">Selecionar todos os estabelecimentos da página:</span>
              <kbd style={{ background: 'var(--bg-subtle)', padding: '3px 8px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                Ctrl + A / ⌘ + A
              </kbd>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
