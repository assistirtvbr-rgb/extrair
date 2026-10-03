import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Maximize2, 
  Layers, 
  Crosshair, 
  Flame, 
  Radar as RadarIcon,
  Navigation
} from 'lucide-react';
import { formatPhone, getCategoryLabel } from '../utils/formatter';
import { formatDistance } from '../utils/distance';

export default function MapView({
  places = [],
  centerLat = -22.9248,
  centerLng = -43.2326,
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
  const heatLayerRef = useRef(null);
  const markersMapRef = useRef(new Map());

  const [isExploreMode, setIsExploreMode] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // Clean, high-contrast B2B map tiles (CartoDB Positron / OSM)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Zoom control on top-left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Create layer groups
    markersLayerRef.current = L.layerGroup().addTo(map);
    heatLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Map click handler for "Explorar Área" mode
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

  // Update map center & radius circle when search coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.setView([centerLat, centerLng], map.getZoom(), { animate: true });

    // Draw / update search radius circle
    if (radiusCircleRef.current) {
      map.removeLayer(radiusCircleRef.current);
    }

    const radiusMeters = radiusKm * 1000;
    radiusCircleRef.current = L.circle([centerLat, centerLng], {
      radius: radiusMeters,
      color: '#183D32',
      weight: 1.8,
      dashArray: '4, 4',
      fillColor: '#2D6A57',
      fillOpacity: 0.08
    }).addTo(map);

  }, [centerLat, centerLng, radiusKm]);

  // Update markers on place list change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const heatLayer = heatLayerRef.current;
    if (!map || !markersLayer || !heatLayer) return;

    markersLayer.clearLayers();
    heatLayer.clearLayers();
    markersMapRef.current.clear();

    // If density/heatmap is enabled, draw density discs
    if (showHeatmap && places.length > 0) {
      places.forEach(p => {
        const lat = p.location?.latitude || p.lat;
        const lng = p.location?.longitude || p.lng;
        if (lat && lng) {
          L.circle([lat, lng], {
            radius: 350,
            color: 'transparent',
            fillColor: '#D46B45',
            fillOpacity: 0.15
          }).addTo(heatLayer);
        }
      });
    }

    // Add markers for places
    places.forEach((place, index) => {
      const lat = place.location?.latitude || place.lat;
      const lng = place.location?.longitude || place.lng;
      if (!lat || !lng) return;

      const placeId = place.id || place.place_id;
      const name = place.displayName?.text || place.name || 'Empresa';
      const category = place.primaryTypeDisplayName?.text || place.primaryType || place.category || 'Estabelecimento';
      const rating = place.rating;
      const reviews = place.userRatingCount || 0;
      const phone = place.nationalPhoneNumber || place.phone;
      const distance = place.distanceKm;

      // Custom discreet HTML Pin
      const markerHtml = `
        <div class="custom-map-marker" id="marker-${placeId}" title="${name}">
          <span style="font-size: 11px; font-weight: 700;">${index + 1}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-icon-wrapper',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(markersLayer);

      // Popup Content
      const popupHtml = `
        <div style="min-width: 200px; padding: 4px; font-family: Inter, sans-serif;">
          <div style="font-size: 13px; font-weight: 700; color: #171816; margin-bottom: 2px;">
            ${name}
          </div>
          <div style="font-size: 11px; color: #6E716B; margin-bottom: 6px;">
            ${getCategoryLabel(category)} • ${formatDistance(distance)}
          </div>
          ${rating ? `
            <div style="display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; margin-bottom: 6px;">
              <span style="color: #f59e0b;">★</span> ${rating} <span style="font-weight: normal; color: #6E716B; font-size: 11px;">(${reviews} reviews)</span>
            </div>
          ` : ''}
          ${phone ? `
            <div style="font-size: 11px; color: #171816; margin-bottom: 8px;">
              📞 ${formatPhone(phone)}
            </div>
          ` : ''}
          <button 
            id="popup-btn-${placeId}" 
            style="width: 100%; padding: 5px 8px; background: #2D6A57; color: #fff; font-size: 12px; font-weight: 600; border-radius: 4px; border: none; cursor: pointer;"
          >
            Ver detalhes
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: false, offset: [0, -10] });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${placeId}`);
        if (btn) {
          btn.onclick = () => onSelectPlace(place);
        }
      });

      marker.on('mouseover', () => {
        onHoverPlace(placeId);
      });

      marker.on('mouseout', () => {
        onHoverPlace(null);
      });

      marker.on('click', () => {
        onSelectPlace(place);
      });

      markersMapRef.current.set(placeId, marker);
    });

    // Fit map bounds smoothly if places exist
    if (places.length > 0) {
      const group = L.featureGroup(Array.from(markersMapRef.current.values()));
      map.fitBounds(group.getBounds().pad(0.2), { maxZoom: 15, animate: true });
    }
  }, [places, showHeatmap]);

  // Highlight marker when active or hovered
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

  // Radar circle overlay
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
          color: '#D46B45',
          weight: 2,
          fillColor: '#D46B45',
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
          title="Clique em qualquer ponto do mapa para pesquisar estabelecimentos naquela região"
        >
          <Crosshair size={14} />
          {isExploreMode ? 'Clique no mapa...' : 'Explorar área'}
        </button>

        <button
          type="button"
          className={`map-control-btn ${showHeatmap ? 'active' : ''}`}
          onClick={() => setShowHeatmap(!showHeatmap)}
          title="Exibir mapa de calor / densidade de concorrência"
        >
          <Flame size={14} />
          Cobertura
        </button>

        <button
          type="button"
          className="map-control-btn"
          onClick={handleRecenter}
          title="Recentralizar no ponto de busca"
        >
          <Navigation size={14} />
          Centro
        </button>
      </div>

      {isExploreMode && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--green-dark)',
          color: '#FFFFFF',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          fontSize: '12px',
          fontWeight: '600',
          boxShadow: 'var(--shadow-md)',
          zIndex: 400,
          pointerEvents: 'none'
        }}>
          🎯 Clique em qualquer lugar no mapa para redefinir o centro da busca
        </div>
      )}
    </div>
  );
}
