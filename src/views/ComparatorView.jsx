import React, { useState } from 'react';
import { 
  BarChart3, 
  MapPin, 
  TrendingUp, 
  Star, 
  Loader2, 
  Award
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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg-main)', padding: '24px' }}>
      {/* Header Form */}
      <div style={{ width: '100%', maxWidth: '960px', margin: '0 auto 24px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={18} color="var(--brand-primary)" />
          <h2 style={{ fontSize: '16px', fontWeight: '800' }}>Comparador de Mercado & Amostras Regionais</h2>
        </div>

        <form onSubmit={handleCompare} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Segmento Comercial</label>
              <input
                type="text"
                placeholder="Ex: odontologia, academia..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
                style={{ width: '100%', height: '40px', padding: '0 12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Região 1</label>
              <input
                type="text"
                value={region1}
                onChange={(e) => setRegion1(e.target.value)}
                placeholder="Bairro / Cidade"
                required
                style={{ width: '100%', height: '40px', padding: '0 12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Região 2</label>
              <input
                type="text"
                value={region2}
                onChange={(e) => setRegion2(e.target.value)}
                placeholder="Bairro / Cidade"
                style={{ width: '100%', height: '40px', padding: '0 12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Região 3 (Opcional)</label>
              <input
                type="text"
                value={region3}
                onChange={(e) => setRegion3(e.target.value)}
                placeholder="Bairro / Cidade"
                style={{ width: '100%', height: '40px', padding: '0 12px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Raio amostral:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[3, 5, 10, 15].map(r => (
                  <button
                    key={r}
                    type="button"
                    className={`btn btn-secondary btn-sm ${radiusKm === r ? 'active' : ''}`}
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
              style={{ minWidth: '160px', height: '40px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <TrendingUp size={15} />
                  <span>Comparar Regiões</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Comparison Results */}
      {comparisonData && comparisonData.length > 0 && (
        <div style={{ maxWidth: '960px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comparisonData.length}, 1fr)`, gap: '16px' }}>
            {comparisonData.map((data, idx) => {
              const isTopDensity = comparisonData.every(d => data.sampleDensity >= d.sampleDensity);

              return (
                <div key={idx} className="detail-card-box" style={{ background: 'var(--bg-panel)', padding: '20px', border: '1px solid var(--border-color)', position: 'relative' }}>
                  {isTopDensity && (
                    <div style={{ position: 'absolute', top: '-10px', right: '14px' }}>
                      <span className="badge badge-brand" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Award size={12} /> Maior Densidade
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <MapPin size={16} color="var(--brand-primary)" />
                    <h3 style={{ fontSize: '15px', fontWeight: '800' }}>{data.regionName}</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="detail-item-row">
                      <span className="detail-item-label">Amostra Encontrada:</span>
                      <span className="detail-item-value tnum" style={{ fontWeight: '800', color: 'var(--brand-primary)' }}>
                        {data.totalSample} empresas
                      </span>
                    </div>

                    <div className="detail-item-row">
                      <span className="detail-item-label">Densidade:</span>
                      <span className="detail-item-value tnum">
                        {data.sampleDensity} emp/km²
                      </span>
                    </div>

                    <div className="detail-item-row">
                      <span className="detail-item-label">Avaliação Média:</span>
                      <span className="detail-item-value tnum" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={13} style={{ color: 'var(--color-warning)', fill: 'var(--color-warning)' }} /> {data.avgRating}
                      </span>
                    </div>

                    <div className="detail-item-row">
                      <span className="detail-item-label">Média de Reviews:</span>
                      <span className="detail-item-value tnum">{data.avgReviews}</span>
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

          <div style={{ background: 'var(--bg-panel)', padding: '14px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            ℹ️ <strong>Nota metodológica:</strong> As métricas acima representam os resultados retornados na consulta amostral do raio selecionado.
          </div>
        </div>
      )}
    </div>
  );
}
