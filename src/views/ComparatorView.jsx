import React, { useState } from 'react';
import { 
  BarChart3, 
  MapPin, 
  TrendingUp, 
  Star, 
  Phone, 
  Globe, 
  Loader2, 
  Award,
  Info
} from 'lucide-react';
import { placesService } from '../services/placesService';
import { geoService } from '../services/geoService';

export default function ComparatorView({ isDemoMode = true }) {
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
        const geo = await geoService.geocode(reg, isDemoMode);
        const lat = geo ? geo.lat : -22.9068;
        const lng = geo ? geo.lng : -43.1729;

        const res = await placesService.searchPlaces({
          query,
          locationName: reg,
          latitude: lat,
          longitude: lng,
          radiusKm,
          isDemo: isDemoMode
        });

        const places = res.places || [];
        const totalSample = places.length;
        
        const validRatings = places.filter(p => p.rating && p.rating > 0);
        const avgRating = validRatings.length > 0
          ? (validRatings.reduce((acc, p) => acc + p.rating, 0) / validRatings.length).toFixed(1)
          : '0.0';

        const avgReviews = totalSample > 0
          ? Math.round(places.reduce((acc, p) => acc + (p.userRatingCount || 0), 0) / totalSample)
          : 0;

        const withPhone = places.filter(p => p.nationalPhoneNumber || p.phone).length;
        const phonePct = totalSample > 0 ? Math.round((withPhone / totalSample) * 100) : 0;

        const withWeb = places.filter(p => p.websiteUri || p.website).length;
        const webPct = totalSample > 0 ? Math.round((withWeb / totalSample) * 100) : 0;

        // Area = pi * r^2
        const areaKm2 = Math.PI * Math.pow(radiusKm, 2);
        const density = (totalSample / areaKm2).toFixed(2);

        results.push({
          regionName: reg,
          totalSample,
          avgRating: parseFloat(avgRating),
          avgReviews,
          phonePct,
          webPct,
          sampleDensity: parseFloat(density),
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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg-main)', padding: '20px' }}>
      {/* Header Form */}
      <div className="filters-panel" style={{ width: '100%', maxWidth: '880px', margin: '0 auto 20px', borderRadius: 'var(--radius-md)' }}>
        <div className="filters-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} color="var(--green-dark)" />
            <h2 style={{ fontSize: '14.5px', fontWeight: '700' }}>Comparador de Mercado & Amostras Regionais</h2>
          </div>
        </div>

        <form onSubmit={handleCompare} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '10px' }}>
            <div className="filter-group">
              <label className="filter-label">Segmento Comercial</label>
              <input
                type="text"
                placeholder="Ex: odontologia, academia..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
                style={{ padding: '7px 10px' }}
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
                style={{ padding: '7px 10px' }}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Região 2</label>
              <input
                type="text"
                value={region2}
                onChange={(e) => setRegion2(e.target.value)}
                placeholder="Bairro / Cidade"
                style={{ padding: '7px 10px' }}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Região 3 (Opcional)</label>
              <input
                type="text"
                value={region3}
                onChange={(e) => setRegion3(e.target.value)}
                placeholder="Bairro / Cidade"
                style={{ padding: '7px 10px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Raio amostral:</span>
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
              className="btn btn-primary btn-sm"
              disabled={loading || !query.trim()}
              style={{ minWidth: '150px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Consultando amostras...
                </>
              ) : (
                <>
                  <TrendingUp size={14} />
                  Comparar Amostras
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Comparison Results */}
      {comparisonData && comparisonData.length > 0 && (
        <div style={{ maxWidth: '880px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comparisonData.length}, 1fr)`, gap: '14px' }}>
            {comparisonData.map((data, idx) => {
              const isTopDensity = comparisonData.every(d => data.sampleDensity >= d.sampleDensity);

              return (
                <div key={idx} className="detail-card-box" style={{ background: 'var(--bg-panel)', padding: '16px', border: '1px solid var(--border-color)', position: 'relative' }}>
                  {isTopDensity && (
                    <div style={{ position: 'absolute', top: '-9px', right: '12px' }}>
                      <span className="badge badge-lime" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Award size={11} /> Maior Densidade Amostral
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <MapPin size={15} color="var(--green-dark)" />
                    <h3 style={{ fontSize: '14px', fontWeight: '700' }}>{data.regionName}</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="detail-item-row">
                      <span className="detail-item-label">Amostra Encontrada:</span>
                      <span className="detail-item-value tnum" style={{ fontWeight: '700', color: 'var(--green-dark)' }}>
                        {data.totalSample} empresas
                      </span>
                    </div>

                    <div className="detail-item-row">
                      <span className="detail-item-label">Densidade da Amostra:</span>
                      <span className="detail-item-value tnum">
                        {data.sampleDensity} emp/km²
                      </span>
                    </div>

                    <div className="detail-item-row">
                      <span className="detail-item-label">Avaliação Média:</span>
                      <span className="detail-item-value tnum" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Star size={12} style={{ color: '#EAB308', fill: '#EAB308' }} /> {data.avgRating}
                      </span>
                    </div>

                    <div className="detail-item-row">
                      <span className="detail-item-label">Média de Reviews:</span>
                      <span className="detail-item-value tnum">{data.avgReviews} reviews</span>
                    </div>

                    <div className="detail-item-row">
                      <span className="detail-item-label">Com Telefone:</span>
                      <span className="detail-item-value tnum">{data.phonePct}%</span>
                    </div>

                    <div className="detail-item-row">
                      <span className="detail-item-label">Com Website:</span>
                      <span className="detail-item-value tnum">{data.webPct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'var(--bg-panel)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            ℹ️ <strong>Nota metodológica:</strong> As métricas acima representam os resultados retornados na consulta amostral do raio selecionado.
          </div>
        </div>
      )}
    </div>
  );
}
