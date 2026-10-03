import React, { useState } from 'react';
import { 
  BarChart3, 
  Search, 
  MapPin, 
  TrendingUp, 
  Star, 
  Phone, 
  Globe, 
  Layers, 
  Loader2, 
  Award 
} from 'lucide-react';
import { placesService } from '../services/placesService';
import { geoService } from '../services/geoService';

export default function ComparatorView() {
  const [query, setQuery] = useState('odontologia');
  const [region1, setRegion1] = useState('Tijuca, Rio de Janeiro');
  const [region2, setRegion2] = useState('Copacabana, Rio de Janeiro');
  const [region3, setRegion3] = useState('Barra da Tijuca, Rio de Janeiro');
  const [radiusKm, setRadiusKm] = useState(5);
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);

    const regions = [region1, region2, region3].filter(r => r && r.trim());

    try {
      const results = [];

      for (const reg of regions) {
        const geo = await geoService.geocode(reg);
        const lat = geo ? geo.lat : -22.9068;
        const lng = geo ? geo.lng : -43.1729;

        const res = await placesService.searchPlaces({
          query,
          latitude: lat,
          longitude: lng,
          radiusKm
        });

        const places = res.places || [];
        const total = places.length;
        
        const validRatings = places.filter(p => p.rating && p.rating > 0);
        const avgRating = validRatings.length > 0
          ? (validRatings.reduce((acc, p) => acc + p.rating, 0) / validRatings.length).toFixed(1)
          : '0.0';

        const avgReviews = total > 0
          ? Math.round(places.reduce((acc, p) => acc + (p.userRatingCount || 0), 0) / total)
          : 0;

        const withPhone = places.filter(p => p.nationalPhoneNumber || p.phone).length;
        const phonePct = total > 0 ? Math.round((withPhone / total) * 100) : 0;

        const withWeb = places.filter(p => p.websiteUri || p.website).length;
        const webPct = total > 0 ? Math.round((withWeb / total) * 100) : 0;

        // Area = pi * r^2
        const areaKm2 = Math.PI * Math.pow(radiusKm, 2);
        const density = (total / areaKm2).toFixed(2);

        results.push({
          regionName: reg,
          total,
          avgRating: parseFloat(avgRating),
          avgReviews,
          phonePct,
          webPct,
          density: parseFloat(density),
          places
        });
      }

      setComparisonData(results);
    } catch (err) {
      console.error('Error during comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg-main)', padding: '24px' }}>
      {/* Header Form */}
      <div className="filters-panel" style={{ width: '100%', maxWidth: '900px', margin: '0 auto 24px', borderRadius: 'var(--radius-md)' }}>
        <div className="filters-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="var(--green-accent)" />
            <h2 style={{ fontSize: '15px', fontWeight: '700' }}>Comparador de Inteligência Comercial por Região</h2>
          </div>
        </div>

        <form onSubmit={handleCompare} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '12px' }}>
            <div className="filter-group">
              <label className="filter-label">Segmento / Categoria</label>
              <input
                type="text"
                placeholder="Ex: odontologia, academia..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
                style={{ padding: '8px 10px' }}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Região 1</label>
              <input
                type="text"
                value={region1}
                onChange={(e) => setRegion1(e.target.value)}
                placeholder="Bairro / Cidade"
                required
                style={{ padding: '8px 10px' }}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Região 2</label>
              <input
                type="text"
                value={region2}
                onChange={(e) => setRegion2(e.target.value)}
                placeholder="Bairro / Cidade"
                style={{ padding: '8px 10px' }}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Região 3 (Opcional)</label>
              <input
                type="text"
                value={region3}
                onChange={(e) => setRegion3(e.target.value)}
                placeholder="Bairro / Cidade"
                style={{ padding: '8px 10px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Raio de análise:</span>
              <div className="radius-selector">
                {[3, 5, 10, 15].map(r => (
                  <button
                    key={r}
                    type="button"
                    className={`radius-chip ${radiusKm === r ? 'active' : ''}`}
                    onClick={() => setRadiusKm(r)}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !query.trim()}
              style={{ minWidth: '160px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Comparando mercados...
                </>
              ) : (
                <>
                  <TrendingUp size={16} />
                  Comparar Regiões
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Comparison Results */}
      {comparisonData && comparisonData.length > 0 && (
        <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comparisonData.length}, 1fr)`, gap: '16px' }}>
            {comparisonData.map((data, idx) => {
              const isTopDensity = comparisonData.every(d => data.density >= d.density);

              return (
                <div key={idx} className="detail-card-box" style={{ background: 'var(--bg-panel)', padding: '18px', border: '1px solid var(--border-color)', position: 'relative' }}>
                  {isTopDensity && (
                    <div style={{ position: 'absolute', top: '-10px', right: '14px' }}>
                      <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Award size={12} /> Maior Densidade
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <MapPin size={16} color="var(--green-accent)" />
                    <h3 style={{ fontSize: '15px', fontWeight: '700' }}>{data.regionName}</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="detail-item-row">
                      <span className="detail-item-label">Total de Empresas:</span>
                      <span className="detail-item-value" style={{ fontSize: '15px', color: 'var(--green-dark)' }}>
                        {data.total} locais
                      </span>
                    </div>

                    <div className="detail-item-row">
                      <span className="detail-item-label">Densidade por km²:</span>
                      <span className="detail-item-value">
                        {data.density} emp/km²
                      </span>
                    </div>

                    <div className="detail-item-row">
                      <span className="detail-item-label">Avaliação Média:</span>
                      <span className="detail-item-value" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Star size={13} className="result-rating-star" /> {data.avgRating}
                      </span>
                    </div>

                    <div className="detail-item-row">
                      <span className="detail-item-label">Média de Reviews:</span>
                      <span className="detail-item-value">{data.avgReviews} por local</span>
                    </div>

                    <div className="detail-item-row">
                      <span className="detail-item-label">Com Telefone:</span>
                      <span className="detail-item-value">{data.phonePct}%</span>
                    </div>

                    <div className="detail-item-row">
                      <span className="detail-item-label">Com Website:</span>
                      <span className="detail-item-value">{data.webPct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'var(--bg-panel)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            💡 <strong>Insight de Mercado:</strong> Áreas com alta densidade e menor percentual de websites representam fortes oportunidades de prospecção para serviços de digitalização, marketing e expansão comercial.
          </div>
        </div>
      )}
    </div>
  );
}
