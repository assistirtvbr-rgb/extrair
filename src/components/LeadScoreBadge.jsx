import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { calculateLeadScore } from '../utils/scoring';

export default function LeadScoreBadge({ place, leadData = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  const scoreResult = calculateLeadScore(place, leadData);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getPriorityLabel = (score) => {
    if (score >= 70) return 'Prioridade Alta';
    if (score >= 40) return 'Prioridade Média';
    return 'Prioridade Baixa';
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={popoverRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={`lead-score-pill ${scoreResult.totalScore >= 70 ? 'high' : scoreResult.totalScore >= 40 ? 'medium' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`${getPriorityLabel(scoreResult.totalScore)} • Score ${scoreResult.totalScore}/100. Clique para ver fatores detalhados.`}
        aria-label={`Score de qualificação ${scoreResult.totalScore} de 100`}
      >
        <Sparkles size={11} />
        <span>{scoreResult.totalScore}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '300px',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 60,
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={15} color="var(--brand-primary)" />
              <span style={{ fontSize: '13px', fontWeight: '800' }}>Qualificação do Lead</span>
            </div>
            <span className="badge badge-brand tnum">
              {scoreResult.totalScore} / 100 pts
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
            {scoreResult.factors.map(f => (
              <div key={f.key} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {f.status === 'positive' ? (
                    <CheckCircle2 size={13} color="var(--color-success)" />
                  ) : f.status === 'neutral' ? (
                    <HelpCircle size={13} color="var(--color-warning)" />
                  ) : (
                    <AlertCircle size={13} color="var(--text-muted)" />
                  )}
                  <span style={{ color: f.points > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {f.label}
                  </span>
                </div>
                <span className="tnum" style={{ fontWeight: '700', color: f.points > 0 ? 'var(--color-success-text)' : 'var(--text-muted)' }}>
                  +{f.points}
                </span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            Calculado transparentemente com base na presença digital, WhatsApp comercial, avaliações reais e proximidade geográfica.
          </div>
        </div>
      )}
    </div>
  );
}
