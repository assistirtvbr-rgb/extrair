import React, { useState, useRef, useEffect } from 'react';
import { Compass, ChevronDown } from 'lucide-react';

export default function RadiusSelector({ radiusKm, setRadiusKm, onChangeComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sliderVal, setSliderVal] = useState(radiusKm);
  const containerRef = useRef(null);

  const quickRadii = [1, 3, 5, 10, 25, 50];

  useEffect(() => {
    setSliderVal(radiusKm);
  }, [radiusKm]);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const handleSelect = (val) => {
    setRadiusKm(val);
    setSliderVal(val);
    setIsOpen(false);
    if (onChangeComplete) onChangeComplete(val);
  };

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setSliderVal(val);
    setRadiusKm(val);
  };

  return (
    <div className="radius-popover-container" ref={containerRef}>
      <button
        type="button"
        className="radius-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Alterar raio de busca geográfica"
        aria-expanded={isOpen}
      >
        <Compass size={15} color="var(--brand-primary)" />
        <span>Até {radiusKm} km</span>
        <ChevronDown size={14} color="var(--text-secondary)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div className="radius-popover-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Raio de Pesquisa
            </span>
            <span style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--brand-primary)' }} className="tnum">
              {sliderVal} km
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={sliderVal}
            onChange={handleSliderChange}
            style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
          />

          <div className="radius-chips-grid">
            {quickRadii.map((r) => (
              <button
                key={r}
                type="button"
                className={`radius-chip-btn ${radiusKm === r ? 'active' : ''}`}
                onClick={() => handleSelect(r)}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
