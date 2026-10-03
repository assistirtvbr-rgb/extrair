import React from 'react';
import { X, RotateCcw, Check, Sparkles } from 'lucide-react';

export default function FiltersPanel({ 
  isOpen, 
  onClose, 
  filters, 
  setFilters, 
  onReset 
}) {
  if (!isOpen) return null;

  const ratingOptions = [
    { value: 0, label: 'Qualquer' },
    { value: 3.0, label: '3.0+' },
    { value: 3.5, label: '3.5+' },
    { value: 4.0, label: '4.0+' },
    { value: 4.5, label: '4.5+' }
  ];

  const reviewOptions = [
    { value: 0, label: 'Qualquer' },
    { value: 10, label: '10+' },
    { value: 25, label: '25+' },
    { value: 50, label: '50+' },
    { value: 100, label: '100+' },
    { value: 500, label: '500+' }
  ];

  const sortOptions = [
    { value: 'distance', label: 'Mais próximos' },
    { value: 'score', label: 'Maior Score LeadMap' },
    { value: 'rating', label: 'Melhor avaliados' },
    { value: 'reviews', label: 'Mais avaliações' },
    { value: 'name', label: 'Nome A-Z' }
  ];

  return (
    <div className="filters-panel-overlay" onClick={onClose}>
      <div className="filters-panel" onClick={(e) => e.stopPropagation()}>
        <div className="filters-panel-header">
          <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Filtros de Prospecção & Ordenação</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Fechar filtros">
            <X size={16} />
          </button>
        </div>

        <div className="filters-panel-body">
          {/* Ordenação */}
          <div className="filter-group">
            <label className="filter-label">Ordenar Resultados</label>
            <div className="filter-options-pills">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`filter-pill ${filters.sortBy === opt.value ? 'active' : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, sortBy: opt.value }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Presença Digital & Canais */}
          <div className="filter-group">
            <label className="filter-label">Canais Digitais & Contato</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '2px' }}>
              <label className="filter-checkbox-row">
                <input
                  type="checkbox"
                  checked={filters.onlyWithPhone}
                  onChange={(e) => setFilters(prev => ({ ...prev, onlyWithPhone: e.target.checked }))}
                />
                <span>Com <strong>telefone</strong> disponível</span>
              </label>

              <label className="filter-checkbox-row">
                <input
                  type="checkbox"
                  checked={filters.onlyWithWhatsApp}
                  onChange={(e) => setFilters(prev => ({ ...prev, onlyWithWhatsApp: e.target.checked }))}
                />
                <span>Com <strong>WhatsApp</strong> comercial identificado</span>
              </label>

              <label className="filter-checkbox-row">
                <input
                  type="checkbox"
                  checked={filters.onlyWithWebsite}
                  onChange={(e) => setFilters(prev => ({ ...prev, onlyWithWebsite: e.target.checked }))}
                />
                <span>Com <strong>website</strong> institucional</span>
              </label>

              <label className="filter-checkbox-row">
                <input
                  type="checkbox"
                  checked={filters.onlyWithInstagram}
                  onChange={(e) => setFilters(prev => ({ ...prev, onlyWithInstagram: e.target.checked }))}
                />
                <span>Com perfil do <strong>Instagram</strong></span>
              </label>

              <label className="filter-checkbox-row">
                <input
                  type="checkbox"
                  checked={filters.onlyOpenNow}
                  onChange={(e) => setFilters(prev => ({ ...prev, onlyOpenNow: e.target.checked }))}
                />
                <span>Aberto agora no momento da busca</span>
              </label>
            </div>
          </div>

          {/* Avaliação Mínima */}
          <div className="filter-group">
            <label className="filter-label">Avaliação no Google Maps</label>
            <div className="filter-options-pills">
              {ratingOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`filter-pill ${filters.minRating === opt.value ? 'active' : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, minRating: opt.value }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantidade de Reviews */}
          <div className="filter-group">
            <label className="filter-label">Base Mínima de Avaliações</label>
            <div className="filter-options-pills">
              {reviewOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`filter-pill ${filters.minReviews === opt.value ? 'active' : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, minReviews: opt.value }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onReset}>
            <RotateCcw size={13} />
            Limpar filtros
          </button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            <Check size={13} />
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
}
