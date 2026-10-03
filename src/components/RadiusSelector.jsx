import React, { useState } from 'react';

export default function RadiusSelector({ radiusKm, setRadiusKm, onChangeComplete }) {
  const quickRadii = [1, 3, 5, 10, 25, 50];
  const [customValue, setCustomValue] = useState(radiusKm);

  const handleQuickSelect = (val) => {
    setRadiusKm(val);
    setCustomValue(val);
    if (onChangeComplete) onChangeComplete(val);
  };

  const handleCustomChange = (e) => {
    const val = parseFloat(e.target.value);
    setCustomValue(e.target.value);
    if (!isNaN(val) && val > 0 && val <= 50) {
      setRadiusKm(val);
    }
  };

  const isQuickActive = quickRadii.includes(radiusKm);

  return (
    <div className="radius-selector" title="Defina o raio da pesquisa em quilômetros">
      {quickRadii.map((r) => (
        <button
          key={r}
          type="button"
          className={`radius-chip ${radiusKm === r ? 'active' : ''}`}
          onClick={() => handleQuickSelect(r)}
        >
          {r} km
        </button>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '2px' }}>
        <input
          type="number"
          min="0.5"
          max="50"
          step="0.5"
          value={customValue}
          onChange={handleCustomChange}
          className="radius-custom-input"
          placeholder="km"
        />
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingRight: '4px' }}>km</span>
      </div>
    </div>
  );
}
