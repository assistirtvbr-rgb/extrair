import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Info, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
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

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={popoverRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="lead-score-pill"
        style={{
          backgroundColor: scoreResult.tierBg,
          color: scoreResult.tierColor,
          border: `1px solid ${scoreResult.tierColor}33`,
          cursor: 'pointer'
        }}
        onClick={() => setIsOpen(!isOpen)}
        title="Clique para ver a qualificação explicável deste lead"
      >
        <Sparkles size={10} />
        <span>{scoreResult.totalScore}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '290px',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 60,
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="var(--green-dark)" />
              <span style={{ fontSize: '12.5px', fontWeight: '700' }}>Score de Prospecção</span>
            </div>
            <span className="badge" style={{ backgroundColor: scoreResult.tierBg, color: scoreResult.tierColor }}>
              {scoreResult.totalScore} / 100
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
            {scoreResult.factors.map(f => (
              <div key={f.key} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {f.status === 'positive' ? (
                    <CheckCircle2 size={12} color="#166534" />
                  ) : f.status === 'neutral' ? (
                    <HelpCircle size={12} color="#854D0E" />
                  ) : (
                    <AlertCircle size={12} color="#9CA3AF" />
                  )}
                  <span style={{ color: f.points > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {f.label}
                  </span>
                </div>
                <span className="tnum" style={{ fontWeight: '600', color: f.points > 0 ? 'var(--green-dark)' : 'var(--text-muted)' }}>
                  +{f.points} pts
                </span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', fontSize: '10.5px', color: 'var(--text-secondary)' }}>
            Calculado com base em canais de contato, maturidade digital, reputação e proximidade.
          </div>
        </div>
      )}
    </div>
  );
}
