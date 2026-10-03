import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Crosshair, 
  Flame, 
  Navigation,
  MapPin
} from 'lucide-react';
import { formatPhone, getCategoryLabel } from '../utils/formatter';
import { formatDistance } from '../utils/distance';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function MapView({
  places = [],
  centerLat = -22.7639,
  centerLng = -43.3994,
  radiusKm = 5,
  activePlace,
  hoveredPlaceId,
  onSelectPlace,
  onHoverPlace,
  radarPlace = null,
  onMapClickExplore = null
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const radarCircleRef = useRef(null);
  const densityLayerRef = useRef(null);
  const markersMapRef = useRef(new Map());

  const [isExploreMode, setIsExploreMode] = useState(false);
  const [showDensity, setShowDensity] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // 100% Free OpenStreetMap Standard Tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.control.zoom({ position: 'topleft' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    densityLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    map.on('click', (e) => {
      if (isExploreMode && onMapClickExplore) {
        onMapClickExplore(e.latlng.lat, e.latlng.lng);
        setIsExploreMode(false);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center & radius circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.setView([centerLat, centerLng], map.getZoom(), { animate: true });

    if (radiusCircleRef.current) {
      map.removeLayer(radiusCircleRef.current);
    }

    const radiusMeters = radiusKm * 1000;
    radiusCircleRef.current = L.circle([centerLat, centerLng], {
      radius: radiusMeters,
      color: '#5262F5',
      weight: 2,
      dashArray: '5, 5',
      fillColor: '#5262F5',
      fillOpacity: 0.06
    }).addTo(map);

  }, [centerLat, centerLng, radiusKm]);

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const densityLayer = densityLayerRef.current;
    if (!map || !markersLayer || !densityLayer) return;

    markersLayer.clearLayers();
    densityLayer.clearLayers();
    markersMapRef.current.clear();

    // Heat/Density concentration layer
    if (showDensity && places.length > 0) {
      places.forEach(p => {
        const lat = p.location?.latitude || p.lat;
        const lng = p.location?.longitude || p.lng;
        if (lat && lng) {
          L.circle([lat, lng], {
            radius: 400,
            color: 'transparent',
            fillColor: '#5262F5',
            fillOpacity: 0.18
          }).addTo(densityLayer);
        }
      });
    }

    // Add clean custom markers
    places.forEach((place, index) => {
      const lat = place.location?.latitude || place.lat;
      const lng = place.location?.longitude || place.lng;
      if (!lat || !lng) return;

      const placeId = place.id || place.place_id;
      const safeName = escapeHtml(place.displayName?.text || place.name || 'Empresa');
      const safeCategory = escapeHtml(getCategoryLabel(place.primaryTypeDisplayName?.text || place.primaryType || place.category));
      const safePhone = place.nationalPhoneNumber ? escapeHtml(formatPhone(place.nationalPhoneNumber)) : null;
      const rating = place.rating;
      const reviews = place.userRatingCount || 0;
      const dist = place.distanceKm;

      const markerHtml = `
        <div class="custom-map-marker" id="marker-${escapeHtml(placeId)}" title="${safeName}">
          <span>${index + 1}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-icon-wrapper',
        html: markerHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(markersLayer);

      const popupHtml = `
        <div style="min-width: 200px; padding: 4px; font-family: 'Manrope', sans-serif;">
          <div style="font-size: 14px; font-weight: 800; color: #20242C; margin-bottom: 2px;">
            ${safeName}
          </div>
          <div style="font-size: 12px; color: #626B79; margin-bottom: 6px;">
            ${safeCategory} • ${formatDistance(dist)}
          </div>
          ${rating ? `
            <div style="display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; margin-bottom: 6px;">
              <span style="color: #F59E0B;">★</span> ${rating} <span style="font-weight: 500; color: #94A3B8;">(${reviews})</span>
            </div>
          ` : ''}
          ${safePhone ? `
            <div style="font-size: 12px; color: #20242C; margin-bottom: 8px;">
              📞 ${safePhone}
            </div>
          ` : ''}
          <button 
            id="popup-btn-${escapeHtml(placeId)}" 
            style="width: 100%; padding: 7px 10px; background: #5262F5; color: #fff; font-size: 12.5px; font-weight: 700; border-radius: 6px; border: none; cursor: pointer; box-shadow: 0 2px 6px rgba(82, 98, 245, 0.35);"
          >
            Ver Ficha Comercial
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: false, offset: [0, -8] });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${placeId}`);
        if (btn) {
          btn.onclick = () => onSelectPlace(place);
        }
      });

      marker.on('mouseover', () => onHoverPlace(placeId));
      marker.on('mouseout', () => onHoverPlace(null));
      marker.on('click', () => onSelectPlace(place));

      markersMapRef.current.set(placeId, marker);
    });

    // Fit map bounds smoothly
    if (places.length > 0) {
      const group = L.featureGroup(Array.from(markersMapRef.current.values()));
      map.fitBounds(group.getBounds().pad(0.18), { maxZoom: 15, animate: true });
    }
  }, [places, showDensity]);

  // Synchronize active and hovered markers
  useEffect(() => {
    const activeId = (activePlace && (activePlace.id || activePlace.place_id)) || hoveredPlaceId;
    
    markersMapRef.current.forEach((marker, id) => {
      const el = document.getElementById(`marker-${id}`);
      if (el) {
        if (id === activeId) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });

    if (activeId && markersMapRef.current.has(activeId)) {
      const marker = markersMapRef.current.get(activeId);
      if (activePlace && (activePlace.id || activePlace.place_id) === activeId) {
        marker.openPopup();
      }
    }
  }, [activePlace, hoveredPlaceId]);

  // Radar circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (radarCircleRef.current) {
      map.removeLayer(radarCircleRef.current);
      radarCircleRef.current = null;
    }

    if (radarPlace) {
      const lat = radarPlace.location?.latitude || radarPlace.lat;
      const lng = radarPlace.location?.longitude || radarPlace.lng;
      if (lat && lng) {
        radarCircleRef.current = L.circle([lat, lng], {
          radius: 2000,
          color: '#E11D48',
          weight: 2,
          fillColor: '#E11D48',
          fillOpacity: 0.12
        }).addTo(map);

        map.setView([lat, lng], 14, { animate: true });
      }
    }
  }, [radarPlace]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([centerLat, centerLng], 14, { animate: true });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Map Controls */}
      <div className="map-layer-controls">
        <button
          type="button"
          className={`map-control-btn ${isExploreMode ? 'active' : ''}`}
          onClick={() => setIsExploreMode(!isExploreMode)}
          title="Clique em qualquer ponto do mapa para reposicionar a pesquisa"
        >
          <Crosshair size={14} />
          <span>{isExploreMode ? 'Clique no mapa...' : 'Explorar Área'}</span>
        </button>

        <button
          type="button"
          className={`map-control-btn ${showDensity ? 'active' : ''}`}
          onClick={() => setShowDensity(!showDensity)}
          title="Exibir mapa de densidade comercial"
        >
          <Flame size={14} />
          <span>Densidade</span>
        </button>

        <button
          type="button"
          className="map-control-btn"
          onClick={handleRecenter}
          title="Recentralizar no ponto de busca"
        >
          <Navigation size={14} />
          <span>Centro</span>
        </button>
      </div>

      {/* Floating Information Badge */}
      <div className="map-info-floating-badge">
        <MapPin size={14} color="#5262F5" />
        <span>Raio de {radiusKm} km • {places.length} locais no mapa</span>
      </div>

      {isExploreMode && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#181C23',
          color: '#FFFFFF',
          padding: '8px 18px',
          borderRadius: 'var(--radius-full)',
          fontSize: '13px',
          fontWeight: '700',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 400,
          pointerEvents: 'none',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          🎯 Clique em qualquer ponto do mapa para reposicionar o centro da busca
        </div>
      )}
    </div>
  );
}
