// Layanan REST API FastAPI + PostGIS (tanpa akses DOM).
// Dipindah dari frontend/js/services/api.js, ditambah normalizeReport() agar respons
// backend/main.py langsung cocok dengan state UI tanpa mengubah komponen.

import { FASTAPI_BASE_URL } from '../config/constants.js';
import { getPlaceName } from '../lib/places.js';
import { getSession } from './auth.js';

function buildAuthHeaders(extra = {}) {
  const session = getSession();
  const headers = { ...extra };
  if (session && session.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }
  return headers;
}

// Samakan bentuk Report dari backend dengan yang dipakai UI.
export function normalizeReport(raw) {
  const photoUrl =
    typeof raw.photo_url === 'string' && raw.photo_url.startsWith('/uploads')
      ? `${FASTAPI_BASE_URL}${raw.photo_url}`
      : raw.photo_url ?? null;

  return {
    ...raw,
    user_id: raw.user_id ?? raw.reporter_id ?? null,
    photo_url: photoUrl,
    // place_name dari backend bila ada; bila kosong diturunkan dari titik terdekat
    place_name: getPlaceName(raw),
    status_history: Array.isArray(raw.status_history) ? raw.status_history : [],
  };
}

export async function fetchReports(timeoutMs = 2500) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/api/reports`, {
      headers: buildAuthHeaders(),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    const list = Array.isArray(payload) ? payload : Array.isArray(payload?.reports) ? payload.reports : [];
    return list.map(normalizeReport);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function postReport({ title, description, latitude, longitude, photoFile, forceSubmit = false }) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('latitude', String(latitude));
  formData.append('longitude', String(longitude));
  formData.append('force_submit', String(forceSubmit));
  if (photoFile) {
    formData.append('photo', photoFile);
  }

  return fetch(`${FASTAPI_BASE_URL}/api/reports`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: formData,
  });
}

export async function postUpvote(reportId) {
  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/api/reports/${reportId}/upvote`, {
      method: 'POST',
      headers: buildAuthHeaders(),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (_) {
    return null;
  }
}

export async function deleteUpvote(reportId) {
  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/api/reports/${reportId}/upvote`, {
      method: 'DELETE',
      headers: buildAuthHeaders(),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (_) {
    return null;
  }
}

export async function patchReportStatus(reportId, status) {
  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/api/reports/${reportId}/status`, {
      method: 'PATCH',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status }),
    });
    return res.ok ? normalizeReport(await res.json()) : null;
  } catch (_) {
    return null;
  }
}
