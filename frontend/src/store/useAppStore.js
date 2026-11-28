import { create } from 'zustand';
import { cloneSeedReports } from '../data/seedReports.js';
import { DUPLICATE_RADIUS_METERS, CAMPUS_BOUNDARY } from '../config/constants.js';
import { haversineDistanceMeters, isPointInPolygon } from '../lib/geo.js';
import { CATEGORY_LABEL } from '../lib/badges.js';
import { predictNlpCategory } from '../lib/nlp.js';
import { fetchReports as apiFetchReports, postReport, postUpvote, deleteUpvote, patchReportStatus, normalizeReport } from '../services/api.js';
import { getSession, logout as clearAuthSession } from '../services/auth.js';

const API_MODE_KEY = 'reportloop.api_mode';
const DEMO_REPORTS_KEY = 'reportloop.demo.reports';
const UPVOTES_KEY_PREFIX = 'reportloop.upvotes';

function readInitialApiMode() {
  try {
    return localStorage.getItem(API_MODE_KEY) === 'live';
  } catch (_) {
    return false;
  }
}

function readStoredDemoReports() {
  try {
    const raw = localStorage.getItem(DEMO_REPORTS_KEY);
    if (!raw) return cloneSeedReports().map(normalizeReport);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeReport);
  } catch (_) {}
  return cloneSeedReports().map(normalizeReport);
}

function saveDemoReports(reports) {
  try {
    localStorage.setItem(DEMO_REPORTS_KEY, JSON.stringify(reports));
  } catch (_) {}
}

function upvoteStorageKey(session) {
  return session?.id ? `${UPVOTES_KEY_PREFIX}.${session.role}.${session.id}` : `${UPVOTES_KEY_PREFIX}.guest`;
}

function readUpvotedIds(session) {
  try {
    const raw = localStorage.getItem(upvoteStorageKey(session));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch (_) {
    return new Set();
  }
}

function saveUpvotedIds(session, setIds) {
  try {
    localStorage.setItem(upvoteStorageKey(session), JSON.stringify(Array.from(setIds)));
  } catch (_) {}
}

function isStalePhotoError(data) {
  const detail = data && typeof data === 'object' ? (data.detail ?? data) : data;
  const text = typeof detail === 'string' ? detail : JSON.stringify(detail || {});
  return /STALE_PHOTO|foto lama|24 jam/i.test(text);
}

const STATUS_FLOW = {
  Received: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: [],
};

const initialSession = getSession();

export const useAppStore = create((set, get) => ({
  session: initialSession,
  isLiveApi: readInitialApiMode(),
  reports: readStoredDemoReports(),
  reportsLoading: false,
  upvotedIds: readUpvotedIds(initialSession),
  toasts: [],
  selectedCoords: { lat: -6.4092, lng: 108.2825 },
  mapFocusTarget: null,
  detailReportId: null,
  duplicatePrompt: null,

  setSelectedCoords: (lat, lng) => {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return;
    set({ selectedCoords: { lat: Number(numLat.toFixed(5)), lng: Number(numLng.toFixed(5)) } });
  },

  focusMapOn: (lat, lng, zoom = 18) => {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return;
    set({ mapFocusTarget: { lat: numLat, lng: numLng, zoom, nonce: Date.now() } });
  },

  openDetailReport: (id) => set({ detailReportId: id ? String(id) : null }),
  closeDetailReport: () => set({ detailReportId: null }),
  closeDuplicatePrompt: () => set({ duplicatePrompt: null }),

  setSession: (session) => set({ session, upvotedIds: readUpvotedIds(session) }),
  refreshSession: () => {
    const s = getSession();
    set({ session: s, upvotedIds: readUpvotedIds(s) });
  },
  logoutSession: () => {
    clearAuthSession();
    set({ session: null, upvotedIds: new Set() });
  },

  pushToast: (message, variant = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
    return id;
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  loadReports: async ({ silent = false } = {}) => {
    if (!get().isLiveApi) {
      set({ reports: readStoredDemoReports(), reportsLoading: false });
      return;
    }
    if (!silent) set({ reportsLoading: true });
    try {
      const liveReports = await apiFetchReports(3000);
      set({ reports: liveReports, reportsLoading: false });
    } catch (_) {
      try { localStorage.setItem(API_MODE_KEY, 'demo'); } catch (_) {}
      set({ isLiveApi: false, reports: readStoredDemoReports(), reportsLoading: false });
      get().pushToast('Server FastAPI lokal belum aktif. Beralih otomatis ke Mode Demo.', 'warning');
    }
  },

  setIsLiveApi: async (nextLive) => {
    const value = Boolean(nextLive);
    try { localStorage.setItem(API_MODE_KEY, value ? 'live' : 'demo'); } catch (_) {}
    set({ isLiveApi: value });
    await get().loadReports();
  },
  toggleApiMode: async () => get().setIsLiveApi(!get().isLiveApi),

  finalizeCreateDemoReport: (payload) => {
    const { session, reports, upvotedIds, pushToast, focusMapOn } = get();
    const newId = 'rep-' + (window.crypto?.randomUUID ? window.crypto.randomUUID().slice(0, 8) : Math.random().toString(16).slice(2, 10));
    const newReport = normalizeReport({
      id: newId,
      user_id: session?.id || null,
      reporter_name: session?.name || null,
      title: payload.title,
      description: payload.description,
      photo_url: payload.photoUrl || null,
      photo_verification: 'Foto bukti baru',
      latitude: payload.latitude,
      longitude: payload.longitude,
      category: payload.nlp.category,
      nlp_confidence: payload.nlp.confidence,
      status: 'Received',
      upvotes: 1,
      created_at: new Date().toISOString(),
      status_history: [],
    });
    const nextReports = [newReport, ...reports];
    const nextUpvotes = new Set(upvotedIds);
    nextUpvotes.add(newReport.id);
    saveDemoReports(nextReports);
    saveUpvotedIds(session, nextUpvotes);
    set({ reports: nextReports, upvotedIds: nextUpvotes, duplicatePrompt: null });
    focusMapOn(newReport.latitude, newReport.longitude, 18);
    pushToast(`Laporan terkirim. Kategori: ${CATEGORY_LABEL[newReport.category] || newReport.category} (${(newReport.nlp_confidence * 100).toFixed(0)}%).`, 'success');
    return { ok: true, report: newReport };
  },

  submitNewReport: async ({ title, description, latitude, longitude, photoFile, photoUrl, isStalePhoto, forceSubmit = false }) => {
    const { isLiveApi, reports, upvotedIds, session, pushToast, focusMapOn, finalizeCreateDemoReport } = get();
    const cleanTitle = String(title || '').trim();
    const cleanDesc = String(description || '').trim();
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!cleanTitle || !cleanDesc) {
      pushToast('Isi judul dan deskripsi laporan terlebih dahulu.', 'error');
      return { ok: false };
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      pushToast('Koordinat belum valid. Pilih titik di peta atau isi latitude dan longitude.', 'error');
      return { ok: false };
    }
    if (!isPointInPolygon(lat, lng, CAMPUS_BOUNDARY)) {
      pushToast('Lokasi di luar area kampus Politeknik Negeri Indramayu. Pilih titik di dalam area kampus pada peta.', 'error');
      return { ok: false };
    }
    if (!photoFile) {
      pushToast('Ambil foto atau pilih file foto bukti terbaru terlebih dahulu.', 'error');
      return { ok: false };
    }
    if (isStalePhoto) {
      pushToast('Foto lama (lebih dari 24 jam) ditolak. Ambil atau pilih foto terbaru (maks. 24 jam).', 'error');
      return { ok: false, stale: true };
    }

    const nlp = predictNlpCategory(cleanTitle, cleanDesc);
    const candidate = { title: cleanTitle, description: cleanDesc, latitude: lat, longitude: lng, nlp, photoUrl, photoFile };

    if (isLiveApi && photoFile) {
      try {
        const res = await postReport({ title: cleanTitle, description: cleanDesc, latitude: lat, longitude: lng, photoFile, forceSubmit });
        const rawText = await res.text();
        let data = {};
        try { data = rawText ? JSON.parse(rawText) : {}; } catch (_) { data = { detail: rawText || null }; }

        if (res.status === 400 && isStalePhotoError(data)) {
          const detailMsg = typeof data.detail === 'string' ? data.detail : data.detail?.message;
          pushToast(detailMsg || 'Foto lama (lebih dari 24 jam) ditolak. Ambil atau pilih foto terbaru (maks. 24 jam).', 'error');
          return { ok: false, stale: true };
        }
        if (res.status === 409 && !forceSubmit) {
          const rawExisting = data.detail?.existing_report || data.existing_report;
          if (rawExisting) {
            const existing = normalizeReport(rawExisting);
            const dist = Number(rawExisting.distance_meters ?? 5);
            set({ duplicatePrompt: { existing, distance: Number.isFinite(dist) ? Number(dist.toFixed(1)) : 5, candidate } });
            return { ok: false, duplicate: true };
          }
          const dupMsg = typeof data.detail === 'string' ? data.detail : data.detail?.message;
          pushToast(dupMsg || 'Laporan serupa sudah ada di sekitar lokasi ini.', 'warning');
          return { ok: false };
        }
        if (res.ok && data && data.id) {
          const saved = normalizeReport(data);
          const nextReports = [saved, ...reports];
          const nextUpvotes = new Set(upvotedIds);
          nextUpvotes.add(saved.id);
          saveUpvotedIds(session, nextUpvotes);
          set({ reports: nextReports, upvotedIds: nextUpvotes, duplicatePrompt: null });
          focusMapOn(saved.latitude, saved.longitude, 18);
          pushToast(`Laporan tersimpan di server (${CATEGORY_LABEL[saved.category] || saved.category}).`, 'success');
          return { ok: true, report: saved };
        }
        const errMsg = typeof data.detail === 'string' ? data.detail : data.detail?.message;
        pushToast(errMsg || `Server menolak laporan (kode ${res.status}). Silakan coba lagi.`, 'error');
        return { ok: false };
      } catch (err) {
        const reason = err?.message ? ` (${err.message})` : '';
        pushToast(`Server FastAPI tidak terjangkau${reason}. Laporan diproses dalam mode demo.`, 'warning');
      }
    }

    if (!forceSubmit) {
      let nearbyDuplicate = null;
      let minDist = Infinity;
      for (const rep of reports) {
        if (rep.status !== 'Resolved' && rep.category === nlp.category) {
          const dist = haversineDistanceMeters(lat, lng, rep.latitude, rep.longitude);
          if (dist <= DUPLICATE_RADIUS_METERS && dist < minDist) {
            minDist = dist;
            nearbyDuplicate = rep;
          }
        }
      }
      if (nearbyDuplicate) {
        set({ duplicatePrompt: { existing: nearbyDuplicate, distance: Number(minDist.toFixed(1)), candidate } });
        return { ok: false, duplicate: true };
      }
    }
    return finalizeCreateDemoReport(candidate);
  },

  toggleUpvoteReport: async (reportId, { allowToggle = true } = {}) => {
    const { reports, upvotedIds, isLiveApi, session, pushToast } = get();
    const key = String(reportId);
    const target = reports.find((r) => String(r.id) === key);
    const alreadyUpvoted = upvotedIds.has(key);

    if (alreadyUpvoted && !allowToggle) {
      pushToast('Anda sudah mendukung laporan ini.', 'info');
      return false;
    }
    if (!target && !isLiveApi) return false;

    if (alreadyUpvoted) {
      if (isLiveApi) {
        const result = await deleteUpvote(key);
        if (result && result.status === 404) {
          const nextUpvotes = new Set(upvotedIds);
          nextUpvotes.delete(key);
          saveUpvotedIds(session, nextUpvotes);
          set({ upvotedIds: nextUpvotes });
          pushToast('Dukungan laporan ini sudah tidak aktif.', 'info');
          return false;
        }
        if (!result || !result.ok) {
          pushToast('Gagal membatalkan dukungan di server FastAPI.', 'error');
          return false;
        }
        const nextReports = reports.map((r) => String(r.id) !== key ? r : (result.data && typeof result.data === 'object' ? normalizeReport({ ...r, ...result.data }) : { ...r, upvotes: Math.max(0, (r.upvotes || 0) - 1) }));
        const nextUpvotes = new Set(upvotedIds);
        nextUpvotes.delete(key);
        saveUpvotedIds(session, nextUpvotes);
        set({ reports: nextReports, upvotedIds: nextUpvotes });
      } else {
        const nextReports = reports.map((r) => String(r.id) === key ? { ...r, upvotes: Math.max(0, (r.upvotes || 0) - 1) } : r);
        const nextUpvotes = new Set(upvotedIds);
        nextUpvotes.delete(key);
        saveDemoReports(nextReports);
        saveUpvotedIds(session, nextUpvotes);
        set({ reports: nextReports, upvotedIds: nextUpvotes });
      }
      pushToast(target ? `Dukungan untuk "${target.title}" dibatalkan.` : 'Dukungan dibatalkan.', 'info');
      return true;
    }

    if (isLiveApi) {
      const result = await postUpvote(key);
      if (result && result.status === 409) {
        const nextUpvotes = new Set(upvotedIds);
        nextUpvotes.add(key);
        saveUpvotedIds(session, nextUpvotes);
        set({ upvotedIds: nextUpvotes });
        pushToast('Anda sudah mendukung laporan ini.', 'info');
        return false;
      }
      if (!result || !result.ok) {
        pushToast('Gagal mengirim dukungan ke server FastAPI.', 'error');
        return false;
      }
      const nextReports = reports.map((r) => String(r.id) !== key ? r : (result.data && typeof result.data === 'object' ? normalizeReport({ ...r, ...result.data }) : { ...r, upvotes: (r.upvotes || 0) + 1 }));
      const nextUpvotes = new Set(upvotedIds);
      nextUpvotes.add(key);
      saveUpvotedIds(session, nextUpvotes);
      set({ reports: nextReports, upvotedIds: nextUpvotes });
    } else {
      const nextReports = reports.map((r) => String(r.id) === key ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r);
      const nextUpvotes = new Set(upvotedIds);
      nextUpvotes.add(key);
      saveDemoReports(nextReports);
      saveUpvotedIds(session, nextUpvotes);
      set({ reports: nextReports, upvotedIds: nextUpvotes });
    }
    pushToast(target ? `Dukungan Anda untuk "${target.title}" tercatat.` : 'Dukungan Anda tercatat.', 'success');
    return true;
  },

  updateReportStatus: async (reportId, newStatus) => {
    const { session, reports, isLiveApi, pushToast } = get();
    if (!session || session.role !== 'admin') {
      pushToast('Hanya Admin Sarpras yang dapat mengubah status laporan.', 'error');
      return false;
    }
    const key = String(reportId);
    const target = reports.find((r) => String(r.id) === key);
    if (!target) return false;
    if (!(STATUS_FLOW[target.status] || []).includes(newStatus)) {
      pushToast('Perubahan status tidak valid. Urutannya: Diterima, Diperbaiki, lalu Selesai.', 'error');
      return false;
    }
    const previousStatus = target.status;
    const historyEntry = { from: previousStatus, to: newStatus, by: session.name || session.id, at: new Date().toISOString() };

    if (isLiveApi) {
      if (!session.token) {
        pushToast('Mode live butuh token server, sedangkan sesi masih demo. Beralih ke mode demo untuk mengubah status.', 'warning');
        return false;
      }
      const updated = await patchReportStatus(key, newStatus);
      if (!updated) {
        pushToast('Gagal memperbarui status di server FastAPI.', 'error');
        return false;
      }
      const nextReports = reports.map((r) => {
        if (String(r.id) !== key) return r;
        const existingHist = Array.isArray(updated.status_history) ? updated.status_history : [];
        return { ...r, ...updated, status_history: existingHist.length > 0 ? existingHist : [...(r.status_history || []), historyEntry] };
      });
      set({ reports: nextReports });
    } else {
      const nextReports = reports.map((r) => String(r.id) === key ? { ...r, status: newStatus, status_history: [...(Array.isArray(r.status_history) ? r.status_history : []), historyEntry] } : r);
      saveDemoReports(nextReports);
      set({ reports: nextReports });
    }
    const label = newStatus === 'In Progress' ? 'Diperbaiki' : newStatus === 'Resolved' ? 'Selesai' : 'Diterima';
    pushToast(`Status "${target.title}" diubah menjadi ${label}.`, 'success');
    return true;
  },
}));
