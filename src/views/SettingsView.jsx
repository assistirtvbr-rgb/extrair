import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Database, 
  Save, 
  RotateCcw, 
  Check, 
  Download, 
  Upload, 
  Server, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { storageService } from '../services/storageService';

export default function SettingsView({ onDataReset, isDemoMode, onToggleDemoMode }) {
  const [settings, setSettings] = useState(storageService.getSettings());
  const [saved, setSaved] = useState(false);
  const [backupJson, setBackupJson] = useState('');
  const [importStatus, setImportStatus] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    storageService.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = storageService.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leadmap-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = () => {
    if (!backupJson.trim()) return;
    try {
      storageService.importBackupJSON(backupJson.trim());
      setImportStatus({ success: true, message: 'Backup restaurado com sucesso!' });
      if (onDataReset) onDataReset();
      setBackupJson('');
    } catch (err) {
      setImportStatus({ success: false, message: `Erro ao importar: ${err.message}` });
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Deseja limpar todo o histórico de buscas?')) {
      storageService.clearHistory();
      if (onDataReset) onDataReset();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('ATENÇÃO: Deseja apagar todos os dados locais (listas, pipeline, notas e favoritos)?')) {
      storageService.clearAllData();
      if (onDataReset) onDataReset();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg-main)', padding: '20px' }}>
      <div style={{ maxWidth: '760px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* Mode Selector Card */}
        <div className="filters-panel" style={{ width: '100%', borderRadius: 'var(--radius-md)' }}>
          <div className="filters-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--green-dark)" />
              <h2 style={{ fontSize: '14.5px', fontWeight: '700' }}>Modo de Operação</h2>
            </div>
            <span className={`badge ${isDemoMode ? 'badge-lime' : 'badge-green'}`}>
              {isDemoMode ? 'Modo Demonstração' : 'Google Places Live'}
            </span>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Alterne entre o <strong>Modo Demonstração</strong> (dados brasileiros de alta fidelidade sem gastar cota) e o <strong>Modo Live Google Places</strong> (requisições reais ao Cloudflare Worker).
            </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                className={`btn ${isDemoMode ? 'btn-lime' : 'btn-secondary'} btn-sm`}
                onClick={() => onToggleDemoMode(true)}
              >
                Ativar Modo Demonstração (Grátis / Offline)
              </button>
              <button
                type="button"
                className={`btn ${!isDemoMode ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => onToggleDemoMode(false)}
              >
                Ativar Modo Google Places (Live Worker)
              </button>
            </div>
          </div>
        </div>

        {/* Backend & Cloudflare Worker Endpoint Card */}
        <div className="filters-panel" style={{ width: '100%', borderRadius: 'var(--radius-md)' }}>
          <div className="filters-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={16} color="var(--green-dark)" />
              <h2 style={{ fontSize: '14.5px', fontWeight: '700' }}>Endpoint Cloudflare Worker</h2>
            </div>
            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> Proxy Seguro
            </span>
          </div>

          <form onSubmit={handleSave} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="filter-group">
              <label className="filter-label">URL do Endpoint de Busca</label>
              <input
                type="text"
                value={settings.workerApiUrl}
                onChange={(e) => setSettings({ ...settings, workerApiUrl: e.target.value })}
                placeholder="/api/search ou https://extrair.rogerin.workers.dev/api/search"
                style={{ padding: '8px 10px' }}
                required
              />
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Todas as chamadas à Google Places API passam pelo Worker para não expor a chave de API no navegador.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                {saved ? <Check size={13} /> : <Save size={13} />}
                {saved ? 'Configurações Salvas!' : 'Salvar Parâmetros'}
              </button>
            </div>
          </form>
        </div>

        {/* Backup & Restore JSON Card */}
        <div className="filters-panel" style={{ width: '100%', borderRadius: 'var(--radius-md)' }}>
          <div className="filters-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} color="var(--green-dark)" />
              <h2 style={{ fontSize: '14.5px', fontWeight: '700' }}>Backup & Restauração Completa de Dados</h2>
            </div>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Exporte seus leads, pipeline, notas, tags e listas em um arquivo JSON seguro ou cole o conteúdo de um backup anterior para restaurar.
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadBackup}>
                <Download size={13} />
                Baixar Arquivo de Backup (.json)
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <label className="filter-label">Restaurar de arquivo JSON</label>
              <textarea
                value={backupJson}
                onChange={(e) => setBackupJson(e.target.value)}
                placeholder="Cole o código JSON do backup aqui para restaurar..."
                style={{ minHeight: '70px', padding: '6px 8px', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}
              />

              {importStatus && (
                <div style={{ fontSize: '12px', color: importStatus.success ? 'var(--green-dark)' : 'var(--terracotta)', fontWeight: '600' }}>
                  {importStatus.message}
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleImportBackup}
                disabled={!backupJson.trim()}
                style={{ width: 'fit-content' }}
              >
                <Upload size={13} />
                Restaurar Backup
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleClearHistory} style={{ color: 'var(--text-secondary)' }}>
                Limpar Histórico
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleClearAll} style={{ color: 'var(--terracotta)' }}>
                Apagar Todos os Dados Locais
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
