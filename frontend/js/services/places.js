// Nama tempat laporan. Dipakai kartu papan, halaman Laporan Saya, dan Profil.
// Urutan: place_name dari server, lalu tempat kampus terdekat, lalu nama umum.

import { CAMPUS_PLACES, PLACE_MATCH_RADIUS_METERS, PLACE_FALLBACK_NAME } from '../config/constants.js';
import { haversineDistanceMeters } from './geo.js';

export function findNearestPlace(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;

  let best = null;
  let bestDist = Infinity;
  for (const place of CAMPUS_PLACES) {
    const dist = haversineDistanceMeters(la, ln, place.lat, place.lng);
    if (dist < bestDist) {
      bestDist = dist;
      best = place;
    }
  }
  return best && bestDist <= PLACE_MATCH_RADIUS_METERS ? best : null;
}

export function getPlaceName(report) {
  if (report && typeof report.place_name === 'string' && report.place_name.trim()) {
    return report.place_name.trim();
  }
  const place = report ? findNearestPlace(report.latitude, report.longitude) : null;
  return place ? place.name : PLACE_FALLBACK_NAME;
}
