import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CampusMap } from '../components/CampusMap.jsx';
import { ReportDetailDialog } from '../components/ReportDetailDialog.jsx';
import { AdminTrackingBox } from '../components/AdminTrackingBox.jsx';
import { ProfilePanel } from '../components/ProfilePanel.jsx';
import { useAppStore } from '../store/useAppStore.js';
import { CATEGORY_LABEL, STATUS_LABEL, getStatusBadgeClass } from '../lib/badges.js';
import { getPlaceName } from '../lib/places.js';

const STATUS_OPTIONS = ['Received', 'In Progress', 'Resolved'];
const STATUS_FLOW = {
  Received: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: [],
};

function parseAdminHash(hash) {
  const raw = String(hash || '').replace(/^#/, '');
  if (raw === 'peta' || raw === 'profil' || raw === 'antrean') return raw;
  return 'antrean';
}

function formatShortDate(isoStr) {
  const t = Date.parse(isoStr);
  if (!Number.isFinite(t)) return '-';
  return new Date(t).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function safePhotoUrl(url) {
  const u = String(url || '');
  return /^(data:image\/|https?:\/\/|\/|\.{0,2}\/)/i.test(u) ? u : '';
}

export function AdminPortalPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);
  const reports = useAppStore((s) => s.reports);
  const reportsLoading = useAppStore((s) => s.reportsLoading);
  const loadReports = useAppStore((s) => s.loadReports);
  const updateReportStatus = useAppStore((s) => s.updateReportStatus);
  const selectedCoords = useAppStore((s) => s.selectedCoords);
  const mapFocusTarget = useAppStore((s) => s.mapFocusTarget);
  const focusMapOn = useAppStore((s) => s.focusMapOn);
  const detailReportId = useAppStore((s) => s.detailReportId);
  const openDetailReport = useAppStore((s) => s.openDetailReport);
  const closeDetailReport = useAppStore((s) => s.closeDetailReport);

  const [activeView, setActiveView] = useState(() => parseAdminHash(location.hash));
  const [prevView, setPrevView] = useState('antrean');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('upvotes');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  const triggerElRef = useRef(null);

  useEffect(() => {
    loadReports({ silent: true });
  }, [loadReports]);

  useEffect(() => {
    const nextView = parseAdminHash(location.hash);
    setActiveView((current) => {
      if (current !== nextView && nextView === 'profil' && current !== 'profil') {
        setPrevView(current);
      }
      return nextView;
    });
  }, [location.hash]);

  const navigateSection = (sectionId) => {
    const target = parseAdminHash(`#${sectionId}`);
    if (target === 'profil' && activeView !== 'profil') {
      setPrevView(activeView);
    }
    setActiveView(target);
    navigate(`/admin#${target}`, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const kpi = useMemo(() => {
    let received = 0;
    let progress = 0;
    let resolved = 0;
    for (const r of reports) {
      if (r.status === 'Received') received += 1;
      else if (r.status === 'In Progress') progress += 1;
      else if (r.status === 'Resolved') resolved += 1;
    }
    return {
      total: reports.length,
      received,
      progress,
      resolved,
    };
  }, [reports]);

  const filteredQueue = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = reports.filter((rep) => {
      if (categoryFilter !== 'ALL' && rep.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && rep.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = `${rep.title || ''} ${rep.description || ''} ${rep.reporter_name || ''} ${rep.reporter_nim || ''} ${rep.place_name || ''}`.toLowerCase();
      return haystack.includes(q);
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'newest') {
        return Date.parse(b.created_at) - Date.parse(a.created_at);
      }
      if (sortBy === 'oldest') {
        return Date.parse(a.created_at) - Date.parse(b.created_at);
      }
      return (b.upvotes || 0) - (a.upvotes || 0) || Date.parse(a.created_at) - Date.parse(b.created_at);
    });
  }, [reports, searchQuery, sortBy, categoryFilter, statusFilter]);

  const selectedReport = detailReportId
    ? reports.find((r) => String(r.id) === String(detailReportId)) || null
    : null;

  const handleOpenDetail = (reportId, triggerEl) => {
    triggerElRef.current = triggerEl || document.activeElement;
    openDetailReport(reportId);
  };

  const handleCloseDetail = () => {
    closeDetailReport();
    const el = triggerElRef.current;
    triggerElRef.current = null;
    if (el && typeof el.focus === 'function') {
      requestAnimationFrame(() => el.focus());
    }
  };

  const handleFocusMap = (lat, lng) => {
    focusMapOn(lat, lng, 18);
    navigateSection('peta');
  };

  const handleStatusChange = async (reportId, nextStatus) => {
    if (!nextStatus) return;
    const target = reports.find((r) => String(r.id) === String(reportId));
    if (!target || target.status === nextStatus) return;
    if (
      nextStatus === 'Resolved' &&
      !window.confirm(`Tandai "${target.title}" sebagai selesai? Status Selesai tidak bisa diubah kembali.`)
    ) {
      return;
    }
    setUpdatingId(String(reportId));
    try {
      await updateReportStatus(reportId, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const sortHintText =
    sortBy === 'newest'
      ? 'Diurutkan berdasarkan laporan terbaru.'
      : sortBy === 'oldest'
        ? 'Diurutkan berdasarkan laporan terlama menunggu.'
        : 'Diurutkan otomatis berdasarkan dukungan terbanyak.';

  return (
    <main id="main-content" className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6">
      <section id="view-admin" className="fade-in space-y-6">
        {activeView === 'profil' ? (
          <ProfilePanel
            session={session}
            onSessionChange={(next) => setSession(next)}
            onBack={() => navigateSection(prevView || 'antrean')}
            onNavigateSection={navigateSection}
          />
        ) : activeView === 'peta' ? (
          <section id="page-peta" className="card p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-xl font-extrabold text-ink-900 dark:text-white">
                  Peta lokasi laporan kampus
                </h1>
                <p className="hint">Klik pin untuk melihat detail laporan.</p>
              </div>
              <button
                type="button"
                onClick={() => navigateSection('antrean')}
                className="btn btn-sm btn-ghost w-full sm:w-auto sm:shrink-0 min-h-[44px]"
              >
                Kembali ke Antrean
              </button>
            </div>

            <div className="relative rounded-lg border border-ink-200 dark:border-ink-800 overflow-hidden bg-ink-100 dark:bg-ink-900">
              <CampusMap
                reports={reports}
                selectedCoords={selectedCoords}
                focusTarget={mapFocusTarget}
                visible={activeView === 'peta'}
                interactiveTarget={false}
                onSelectReport={(rep, el) => handleOpenDetail(rep.id, el)}
              />
            </div>
          </section>
        ) : (
          <div id="page-antrean" className="space-y-6">
            <div id="ringkasan" className="card overflow-hidden">
              <h2 className="sr-only">Ringkasan laporan</h2>
              <dl className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-ink-200 dark:divide-ink-800 lg:divide-x">
                <div className="p-3.5 sm:p-5 border-r border-ink-200 dark:border-ink-800 lg:border-r-0">
                  <dt className="text-xs sm:text-sm font-semibold text-ink-600 dark:text-ink-300">Semua laporan</dt>
                  <dd className="mt-1 text-2xl sm:text-3xl font-extrabold text-ink-900 dark:text-white font-mono">
                    {kpi.total}
                  </dd>
                </div>
                <div className="p-3.5 sm:p-5">
                  <dt className="text-xs sm:text-sm font-semibold text-ink-600 dark:text-ink-300">Menunggu ditangani</dt>
                  <dd className="mt-1 text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-300 font-mono">
                    {kpi.received}
                  </dd>
                </div>
                <div className="p-3.5 sm:p-5 border-r border-ink-200 dark:border-ink-800 lg:border-r-0">
                  <dt className="text-xs sm:text-sm font-semibold text-ink-600 dark:text-ink-300">Sedang diperbaiki</dt>
                  <dd className="mt-1 text-2xl sm:text-3xl font-extrabold text-brand-700 dark:text-brand-400 font-mono">
                    {kpi.progress}
                  </dd>
                </div>
                <div className="p-3.5 sm:p-5">
                  <dt className="text-xs sm:text-sm font-semibold text-ink-600 dark:text-ink-300">Selesai</dt>
                  <dd className="mt-1 text-2xl sm:text-3xl font-extrabold text-green-700 dark:text-green-400 font-mono">
                    {kpi.resolved}
                  </dd>
                </div>
              </dl>
            </div>

            <div id="antrean" className="card overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-ink-200 dark:border-ink-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h1 className="text-xl font-extrabold text-ink-900 dark:text-white">Antrean laporan Sarpras</h1>
                    <p className="text-sm text-ink-600 dark:text-ink-300" aria-live="polite">
                      Menampilkan {filteredQueue.length} dari {reports.length} laporan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateSection('peta')}
                    className="btn btn-sm btn-ghost w-full sm:w-auto sm:shrink-0 min-h-[44px]"
                  >
                    Lihat Peta Kampus
                  </button>
                </div>
                <p className="hint">{sortHintText}</p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label htmlFor="admin-search" className="label">Cari laporan</label>
                    <input
                      id="admin-search"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="field"
                      placeholder="Judul, deskripsi, atau pelapor"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-sort" className="label">Urutkan</label>
                    <select
                      id="admin-sort"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="field"
                    >
                      <option value="upvotes">Dukungan terbanyak</option>
                      <option value="newest">Terbaru</option>
                      <option value="oldest">Terlama menunggu</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="admin-filter-category" className="label">Kategori</label>
                    <select
                      id="admin-filter-category"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="field"
                    >
                      <option value="ALL">Semua kategori</option>
                      <option value="Infrastructure">Infrastruktur</option>
                      <option value="Cleanliness">Kebersihan</option>
                      <option value="Security">Keamanan</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="admin-filter-status" className="label">Status</label>
                    <select
                      id="admin-filter-status"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="field"
                    >
                      <option value="ALL">Semua status</option>
                      <option value="Received">Diterima</option>
                      <option value="In Progress">Diperbaiki</option>
                      <option value="Resolved">Selesai</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-ink-200 dark:divide-ink-800">
                {reportsLoading && reports.length === 0 ? (
                  <div className="state-box" role="status">
                    <strong>Memuat antrean triase</strong>
                    Mengambil daftar laporan fasilitas kampus...
                  </div>
                ) : filteredQueue.length === 0 ? (
                  <div className="state-box">
                    <strong>Tidak ada laporan dalam antrean</strong>
                    Tidak ada laporan yang cocok dengan filter kategori, status, atau pencarian saat ini.
                  </div>
                ) : (
                  filteredQueue.map((rep, idx) => {
                    const isUpdating = updatingId === String(rep.id);
                    const allowedNext = STATUS_FLOW[rep.status] || [];
                    const isLocked = allowedNext.length === 0;
                    const photoSrc = safePhotoUrl(rep.photo_url);
                    const confidenceText = Number.isFinite(rep.nlp_confidence)
                      ? `Tebakan kategori ${(rep.nlp_confidence * 100).toFixed(0)}%`
                      : '';
                    return (
                      <article
                        key={rep.id}
                        className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-200">
                              #{idx + 1}
                            </span>
                            <span className="badge badge-cat">
                              {CATEGORY_LABEL[rep.category] || rep.category}
                            </span>
                            <span className={getStatusBadgeClass(rep.status)}>
                              {STATUS_LABEL[rep.status] || rep.status}
                            </span>
                            <span className="text-xs font-bold text-brand-700 dark:text-brand-400">
                              +{Number(rep.upvotes || 0)} Dukungan
                            </span>
                          </div>

                          <h2 className="text-base sm:text-lg font-bold text-ink-900 dark:text-white">
                            <button
                              type="button"
                              onClick={(e) => handleOpenDetail(rep.id, e.currentTarget)}
                              className="text-left hover:underline cursor-pointer"
                            >
                              {rep.title}
                            </button>
                          </h2>

                          <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed">
                            {rep.description}
                          </p>

                          {(rep.photo_verification || confidenceText) && (
                            <p className="text-xs text-ink-600 dark:text-ink-400">
                              {rep.photo_verification || ''}
                              {rep.photo_verification && confidenceText ? ' \u2022 ' : ''}
                              {confidenceText}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600 dark:text-ink-300">
                            <span>
                              Pelapor: <strong>{rep.reporter_name || 'Mahasiswa Polindra'}</strong>
                              {rep.reporter_nim ? ` (${rep.reporter_nim})` : ''}
                            </span>
                            <span>Tanggal: {formatShortDate(rep.created_at)}</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-ink-900 dark:text-white">
                              <svg
                                className="w-3.5 h-3.5 shrink-0 text-brand-700 dark:text-brand-400"
                                aria-hidden="true"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                              </svg>
                              <span>{getPlaceName(rep)}</span>
                            </span>
                          </div>

                          {photoSrc && (
                            <div>
                              <a
                                href={photoSrc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                              >
                                <img
                                  src={photoSrc}
                                  alt={`Foto bukti: ${rep.title}`}
                                  width="128"
                                  height="80"
                                  loading="lazy"
                                  decoding="async"
                                  className="h-20 w-32 rounded-lg border border-ink-200 dark:border-ink-800 object-cover"
                                />
                              </a>
                            </div>
                          )}

                          <div className="pt-1 max-w-md">
                            <AdminTrackingBox report={rep} />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-2 shrink-0 lg:w-48">
                          <div className="w-full">
                            <label htmlFor={`status-${rep.id}`} className="label">Ubah status</label>
                            <select
                              id={`status-${rep.id}`}
                              value={rep.status}
                              disabled={isUpdating || isLocked}
                              onChange={(e) => handleStatusChange(rep.id, e.target.value)}
                              className="field"
                            >
                              {STATUS_OPTIONS.map((st) => (
                                <option
                                  key={st}
                                  value={st}
                                  disabled={st !== rep.status && !allowedNext.includes(st)}
                                >
                                  {STATUS_LABEL[st] || st}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-2 w-full">
                            <button
                              type="button"
                              onClick={(e) => handleOpenDetail(rep.id, e.currentTarget)}
                              className="btn btn-sm btn-ghost flex-1 min-h-[44px] cursor-pointer"
                            >
                              Detail
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFocusMap(rep.latitude, rep.longitude)}
                              className="btn btn-sm btn-ghost flex-1 min-h-[44px] cursor-pointer"
                            >
                              Peta
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <ReportDetailDialog
        report={selectedReport}
        isUpvoted={false}
        showUpvote={false}
        onClose={handleCloseDetail}
        onFocusMap={handleFocusMap}
      />
    </main>
  );
}
