import React, { useState, useRef } from 'react';
import { X, Sparkles, Loader2, CheckCircle, AlertTriangle, Globe } from 'lucide-react';
import { enrichmentService } from '../services/enrichmentService';

export default function BatchEnrichModal({
  isOpen,
  onClose,
  places = [],
  onEnrichmentComplete
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, percent: 0, currentName: '' });
  const [summary, setSummary] = useState(null);
  const abortControllerRef = useRef(null);

  if (!isOpen) return null;

  const placesWithWeb = places.filter(p => Boolean(p.websiteUri || p.website));
  const total = placesWithWeb.length;

  const handleStart = async () => {
    setIsRunning(true);
    setSummary(null);
    abortControllerRef.current = new AbortController();

    try {
      const results = await enrichmentService.enrichBatch(
        placesWithWeb,
        (prog) => setProgress(prog),
        abortControllerRef.current.signal
      );

      const successful = results.filter(r => r.success).length;
      setSummary({
        total,
        successful,
        failed: total - successful
      });

      if (onEnrichmentComplete) onEnrichmentComplete();
    } catch (err) {
      console.warn('Batch enrichment interrupted:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
  };

  return (
    <div className="modal-overlay" onClick={isRunning ? undefined : onClose}>
      <div className="modal-card" style={{ width: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--green-dark)" />
            <h3 style={{ fontSize: '15px' }}>Enriquecimento Digital em Lote</h3>
          </div>
          {!isRunning && (
            <button className="btn-icon" onClick={onClose}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="modal-body">
          {!summary ? (
            <>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                O robô consultará as páginas públicas dos websites das empresas selecionadas para identificar automaticamente <strong>WhatsApp</strong>, <strong>Instagram</strong>, <strong>LinkedIn</strong>, <strong>Facebook</strong> e <strong>E-mail comercial</strong>.
              </p>

              <div className="detail-card-box">
                <div className="detail-item-row">
                  <span className="detail-item-label">Total de empresas selecionadas:</span>
                  <span className="detail-item-value">{places.length}</span>
                </div>
                <div className="detail-item-row">
                  <span className="detail-item-label">Com website para rastreamento:</span>
                  <span className="detail-item-value">{total}</span>
                </div>
                {places.length - total > 0 && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    ℹ️ {places.length - total} empresas não possuem website cadastrado e serão ignoradas.
                  </div>
                )}
              </div>

              {isRunning && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ fontWeight: '600' }}>{progress.currentName || 'Analisando...'}</span>
                    <span className="tnum">{progress.completed} / {total} ({progress.percent}%)</span>
                  </div>

                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${progress.percent}%`,
                        height: '100%',
                        background: 'var(--green-dark)',
                        transition: 'width 200ms ease'
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center', padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <CheckCircle size={36} color="var(--green-dark)" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700' }}>Enriquecimento Concluído!</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {summary.successful} {summary.successful === 1 ? 'empresa enriquecida' : 'empresas enriquecidas'} com sucesso.
                {summary.failed > 0 && ` (${summary.failed} websites com bloqueio ou inacessíveis)`}
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {summary ? (
            <button className="btn btn-primary btn-sm" onClick={onClose}>
              Fechar
            </button>
          ) : isRunning ? (
            <button className="btn btn-secondary btn-sm" onClick={handleCancel}>
              Cancelar processo
            </button>
          ) : (
            <>
              <button className="btn btn-secondary btn-sm" onClick={onClose}>
                Cancelar
              </button>
              <button
                className="btn btn-lime btn-sm"
                onClick={handleStart}
                disabled={total === 0}
              >
                <Sparkles size={14} />
                Iniciar Enriquecimento ({total})
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
