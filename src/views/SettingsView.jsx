import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Database, 
  Save, 
  Check, 
  Download, 
  Upload, 
  Server, 
  Sparkles
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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg-main)', padding: '24px' }}>
      <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Mode Selector Card */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} color="var(--brand-primary)" />
              <h2 style={{ fontSize: '15px', fontWeight: '800' }}>Modo de Operação</h2>
            </div>
            <span className={`badge ${isDemoMode ? 'badge-brand' : 'badge-success'}`}>
              {isDemoMode ? 'Modo Demonstração' : 'Modo Produção Live'}
            </span>
          </div>

          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Alterne entre o <strong>Modo Demonstração</strong> (dados brasileiros com alta fidelidade sem necessidade de chaves) e o <strong>Modo Produção Live</strong> (OpenStreetMap Overpass API + Google Places API via Cloudflare Worker).
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn ${isDemoMode ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => onToggleDemoMode(true)}
              >
                Ativar Modo Demonstração (Grátis / Offline)
              </button>
              <button
                type="button"
                className={`btn ${!isDemoMode ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => onToggleDemoMode(false)}
              >
                Ativar Modo Live (OpenStreetMap / Google Places)
              </button>
            </div>
          </div>
        </div>

        {/* Backend & Cloudflare Worker Endpoint Card */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Server size={18} color="var(--brand-primary)" />
              <h2 style={{ fontSize: '15px', fontWeight: '800' }}>Endpoint Cloudflare Worker</h2>
            </div>
            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} /> Proxy Seguro
            </span>
          </div>

          <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                URL do Endpoint da API
              </label>
              <input
                type="text"
                value={settings.workerApiUrl}
                onChange={(e) => setSettings({ ...settings, workerApiUrl: e.target.value })}
                placeholder="/api/search"
                style={{ width: '100%', height: '42px', padding: '0 12px' }}
                required
              />
              <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Todas as consultas passam pelo Worker para manter as chaves seguras e permitir scraping com proteção SSRF.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                {saved ? <Check size={14} /> : <Save size={14} />}
                <span>{saved ? 'Configurações Salvas!' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Backup & Restore JSON Card */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={18} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '15px', fontWeight: '800' }}>Backup e Armazenamento Local</h2>
          </div>

          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Exporte seus leads, pipeline, notas comerciais, tags e listas salvas em um arquivo JSON seguro ou cole um backup anterior para restaurar.
            </p>

            <div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadBackup}>
                <Download size={14} />
                <span>Baixar Arquivo de Backup (.json)</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                Restaurar Backup a partir de JSON
              </label>
              <textarea
                value={backupJson}
                onChange={(e) => setBackupJson(e.target.value)}
                placeholder="Cole o código JSON do backup aqui..."
                style={{ minHeight: '80px', padding: '10px 12px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
              />

              {importStatus && (
                <div style={{ fontSize: '13px', color: importStatus.success ? 'var(--color-success)' : 'var(--color-alert)', fontWeight: '700' }}>
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
                <Upload size={14} />
                <span>Restaurar Dados</span>
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleClearHistory} style={{ color: 'var(--text-secondary)' }}>
                Limpar Histórico de Busca
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleClearAll} style={{ color: 'var(--color-alert)' }}>
                Apagar Todos os Dados Locais
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
