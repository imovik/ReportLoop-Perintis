import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CAMPUS_CENTER, CAMPUS_BOUNDARY } from '../config/constants.js';
import { getStatusPinColor, STATUS_LABEL, CATEGORY_LABEL } from '../lib/badges.js';

function escapePopupText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function CampusMap({
  reports = [],
  selectedCoords = null,
  onSelectCoords = null,
  onSelectReport = null,
  focusTarget = null,
  visible = true,
  interactiveTarget = true,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const targetMarkerRef = useRef(null);
  const reportMarkersLayerRef = useRef(null);
  const reportsRef = useRef(reports);
  reportsRef.current = reports;
  const onSelectCoordsRef = useRef(onSelectCoords);
  onSelectCoordsRef.current = onSelectCoords;
  const onSelectReportRef = useRef(onSelectReport);
  onSelectReportRef.current = onSelectReport;

  // Inisialisasi instance Leaflet sekali dalam non-reactive ref
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: CAMPUS_CENTER,
      zoom: 17,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    L.polygon(CAMPUS_BOUNDARY, {
      color: '#1d4ed8',
      weight: 1.5,
      dashArray: '5, 5',
      fillColor: '#1d4ed8',
      fillOpacity: 0.05,
    })
      .addTo(map)
      .bindTooltip('Area kampus Politeknik Negeri Indramayu', { sticky: false });

    const markersLayer = L.layerGroup().addTo(map);
    reportMarkersLayerRef.current = markersLayer;
    mapRef.current = map;

    map.on('popupopen', (e) => {
      const popupEl = e.popup?.getElement?.();
      const btn = popupEl?.querySelector?.('[data-popup-detail-id]');
      if (!btn) return;
      btn.onclick = () => {
        const id = btn.getAttribute('data-popup-detail-id');
        const found = reportsRef.current.find((item) => String(item.id) === String(id));
        if (found) onSelectReportRef.current?.(found, btn);
      };
    });

    if (interactiveTarget) {
      const initialLat = Number.isFinite(Number(selectedCoords?.lat)) ? Number(selectedCoords.lat) : -6.4092;
      const initialLng = Number.isFinite(Number(selectedCoords?.lng)) ? Number(selectedCoords.lng) : 108.2825;

      const targetIcon = L.divIcon({
        className: 'custom-target-pin',
        html: '<div class="target-pin-pulse"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([initialLat, initialLng], {
        icon: targetIcon,
        draggable: true,
        keyboard: false,
      }).addTo(map);

      marker.bindPopup('<b>Titik laporan baru</b><br/>Geser pin atau klik peta untuk memindahkan.');

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        onSelectCoordsRef.current?.(pos.lat, pos.lng);
      });

      map.on('click', (e) => {
        onSelectCoordsRef.current?.(e.latlng.lat, e.latlng.lng);
      });

      targetMarkerRef.current = marker;
    }

    return () => {
      map.remove();
      mapRef.current = null;
      targetMarkerRef.current = null;
      reportMarkersLayerRef.current = null;
    };
  }, [interactiveTarget]);

  // Sinkronisasi posisi pin target ketika koordinat berubah dari input, preset, atau GPS
  useEffect(() => {
    const marker = targetMarkerRef.current;
    if (!marker || !selectedCoords) return;
    const lat = Number(selectedCoords.lat);
    const lng = Number(selectedCoords.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const current = marker.getLatLng();
    if (Math.abs(current.lat - lat) > 1e-6 || Math.abs(current.lng - lng) > 1e-6) {
      marker.setLatLng([lat, lng]);
    }
  }, [selectedCoords]);

  // Fokus kamera peta ketika ada permintaan focusMapOn
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusTarget) return;
    const lat = Number(focusTarget.lat);
    const lng = Number(focusTarget.lng);
    const zoom = Number(focusTarget.zoom) || 18;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.setView([lat, lng], zoom);
    }
  }, [focusTarget]);

  // Invalidate ukuran peta saat container baru terlihat dari kondisi hidden
  useEffect(() => {
    if (!visible || !mapRef.current) return;
    const frame = requestAnimationFrame(() => {
      mapRef.current?.invalidateSize();
    });
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  // Render pin seluruh laporan pada layer group
  useEffect(() => {
    const layer = reportMarkersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    reports.forEach((rep) => {
      const lat = Number(rep.latitude);
      const lng = Number(rep.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const color = getStatusPinColor(rep.status);
      const pinHtml = `
        <div style="
          width: 26px;
          height: 26px;
          background: ${color};
          border: 3px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 6px rgba(15,23,42,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 7px; height: 7px; background: #fff; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'report-status-pin',
        html: pinHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        popupAnchor: [0, -24],
      });

      const marker = L.marker([lat, lng], { icon, keyboard: false });
      marker.bindPopup(`
        <div style="min-width: 190px;">
          <div style="font-size: 12px; font-weight: 700; color: ${color}; margin-bottom: 2px;">
            ${escapePopupText(STATUS_LABEL[rep.status] || rep.status)} &bull; ${escapePopupText(CATEGORY_LABEL[rep.category] || rep.category)}
          </div>
          <div style="font-size: 14px; font-weight: 700; color: var(--ink); margin-bottom: 4px;">
            ${escapePopupText(rep.title)}
          </div>
          <div style="font-size: 12px; color: var(--ink-soft); margin-bottom: 6px;">
            ${escapePopupText(rep.description)}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px;">
            <span style="font-size: 12px; font-weight: 700; color: var(--brand);">
              ${Number(rep.upvotes || 0)} dukungan
            </span>
            <button type="button" data-popup-detail-id="${escapePopupText(rep.id)}" style="font-size: 12px; font-weight: 700; color: var(--brand); text-decoration: underline; background: none; border: 0; padding: 4px 0; cursor: pointer;">
              Detail
            </button>
          </div>
        </div>
      `);
      marker.addTo(layer);
    });
  }, [reports]);

  return <div id="campus-map" ref={containerRef} role="application" aria-label="Peta kampus Politeknik Negeri Indramayu" />;
}
