import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReportForm } from '../components/ReportForm.jsx';
import { CampusMap } from '../components/CampusMap.jsx';
import { ReportCard } from '../components/ReportCard.jsx';
import { ReportDetailDialog } from '../components/ReportDetailDialog.jsx';
import { DuplicateModal } from '../components/DuplicateModal.jsx';
import { MyReportsView } from '../components/MyReportsView.jsx';
import { ProfilePanel } from '../components/ProfilePanel.jsx';
import { useAppStore } from '../store/useAppStore.js';
import { CAMPUS_BOUNDARY, CAMPUS_PLACES } from '../config/constants.js';
import { isPointInPolygon } from '../lib/geo.js';
import { CATEGORY_LABEL, STATUS_LABEL } from '../lib/badges.js';

const STATUS_FILTERS = ['ALL', 'Received', 'In Progress', 'Resolved'];
const CATEGORY_FILTERS = ['ALL', 'Infrastructure', 'Cleanliness', 'Security'];

function parseHashView(hash) {
  const raw = String(hash || '').replace(/^#/, '');
  if (raw === 'papan' || raw === 'laporan-saya' || raw === 'profil' || raw === 'lapor') {
    return raw;
  }
  return 'lapor';
}

export function UserPortalPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);
  const reports = useAppStore((s) => s.reports);
  const reportsLoading = useAppStore((s) => s.reportsLoading);
  const loadReports = useAppStore((s) => s.loadReports);
  const upvotedIds = useAppStore((s) => s.upvotedIds);
  const toggleUpvoteReport = useAppStore((s) => s.toggleUpvoteReport);
  const selectedCoords = useAppStore((s) => s.selectedCoords);
  const setSelectedCoords = useAppStore((s) => s.setSelectedCoords);
  const mapFocusTarget = useAppStore((s) => s.mapFocusTarget);
  const focusMapOn = useAppStore((s) => s.focusMapOn);
  const detailReportId = useAppStore((s) => s.detailReportId);
  const openDetailReport = useAppStore((s) => s.openDetailReport);
  const closeDetailReport = useAppStore((s) => s.closeDetailReport);
  const duplicatePrompt = useAppStore((s) => s.duplicatePrompt);
  const closeDuplicatePrompt = useAppStore((s) => s.closeDuplicatePrompt);
  const submitNewReport = useAppStore((s) => s.submitNewReport);
  const pushToast = useAppStore((s) => s.pushToast);

  const [activeView, setActiveView] = useState(() => parseHashView(location.hash));
  const [prevView, setPrevView] = useState('lapor');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('upvotes');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  const triggerElRef = useRef(null);
  const mapSectionRef = useRef(null);

  useEffect(() => {
    loadReports({ silent: true });
  }, [loadReports]);

  useEffect(() => {
    const nextView = parseHashView(location.hash);
    setActiveView((current) => {
      if (current !== nextView && nextView === 'profil' && current !== 'profil') {
        setPrevView(current);
      }
      return nextView;
    });
  }, [location.hash]);

  const navigateSection = (sectionId) => {
    const target = parseHashView(`#${sectionId}`);
    if (target === 'profil' && activeView !== 'profil') {
      setPrevView(activeView);
    }
    setActiveView(target);
    navigate(`/user#${target}`, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      pushToast('Perangkat atau browser ini tidak mendukung GPS.', 'error');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        if (!isPointInPolygon(lat, lng, CAMPUS_BOUNDARY)) {
          pushToast(
            'Koordinat GPS berada di luar area kampus Politeknik Negeri Indramayu. Silakan pilih titik di dalam peta kampus.',
            'warning'
          );
          return;
        }
        setSelectedCoords(lat, lng);
        focusMapOn(lat, lng, 18);
        pushToast('Lokasi GPS Anda berhasil disematkan pada peta kampus.', 'success');
      },
      (err) => {
        setGpsLoading(false);
        const msg =
          err?.code === 1
            ? 'Izin akses lokasi ditolak oleh browser.'
            : 'Tidak dapat memperoleh sinyal GPS. Pilih titik secara manual pada peta.';
        pushToast(msg, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handlePresetClick = (place) => {
    setSelectedCoords(place.lat, place.lng);
    focusMapOn(place.lat, place.lng, 18);
    pushToast(`Titik disematkan: ${place.name}`, 'info');
  };

  const counts = useMemo(
    () => ({
      ALL: reports.length,
      Received: reports.filter((r) => r.status === 'Received').length,
      'In Progress': reports.filter((r) => r.status === 'In Progress').length,
      Resolved: reports.filter((r) => r.status === 'Resolved').length,
    }),
    [reports]
  );

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = reports.filter((rep) => {
      if (statusFilter !== 'ALL' && rep.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && rep.category !== categoryFilter) return false;
      if (!q) return true;
      const haystack = `${rep.title || ''} ${rep.description || ''} ${rep.place_name || ''}`.toLowerCase();
      return haystack.includes(q);
    });
    return [...list].sort((a, b) =>
      sortBy === 'newest'
        ? Date.parse(b.created_at) - Date.parse(a.created_at)
        : (b.upvotes || 0) - (a.upvotes || 0) || Date.parse(a.created_at) - Date.parse(b.created_at)
    );
  }, [reports, statusFilter, categoryFilter, searchQuery, sortBy]);

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
    navigateSection('lapor');
    requestAnimationFrame(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const handleToggleUpvote = async (reportId, triggerEl) => {
    await toggleUpvoteReport(reportId, { allowToggle: true });
    if (triggerEl && typeof triggerEl.focus === 'function') {
      requestAnimationFrame(() => triggerEl.focus());
    }
  };

  const handleDuplicateUpvote = async (existingId) => {
    closeDuplicatePrompt();
    await toggleUpvoteReport(existingId, { allowToggle: false });
    setFormResetKey((k) => k + 1);
    navigateSection('papan');
  };

  const handleDuplicateForceSubmit = async (candidate) => {
    if (!candidate) return;
    closeDuplicatePrompt();
    const res = await submitNewReport({
      title: candidate.title,
      description: candidate.description,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      photoFile: candidate.photoFile,
      photoUrl: candidate.photoUrl || null,
      isStalePhoto: false,
      forceSubmit: true,
    });
    if (res?.ok) {
      setFormResetKey((k) => k + 1);
    }
  };

  return (
    <main id="main-content" className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6">
      <section id="view-mahasiswa" className="fade-in space-y-6">
        {activeView === 'profil' ? (
          <ProfilePanel
            session={session}
            onSessionChange={(next) => setSession(next)}
            onBack={() => navigateSection(prevView || 'lapor')}
            onNavigateSection={navigateSection}
          />
        ) : activeView === 'laporan-saya' ? (
          <MyReportsView
            session={session}
            reports={reports}
            upvotedIds={upvotedIds}
            onOpenDetail={handleOpenDetail}
            onToggleUpvote={handleToggleUpvote}
            onNavigateSection={navigateSection}
          />
        ) : activeView === 'papan' ? (
          <section id="page-papan" className="card overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-ink-900 dark:text-white">
                    Papan laporan kampus
                  </h1>
                  <p className="text-sm text-ink-600 dark:text-ink-300" aria-live="polite">
                    Menampilkan {filteredReports.length} dari {reports.length} laporan fasilitas kampus.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => navigateSection('lapor')}
                    className="btn btn-sm btn-ghost w-full sm:w-auto min-h-[44px]"
                  >
                    Kembali ke Peta &amp; Lapor
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateSection('lapor')}
                    className="btn btn-sm btn-primary w-full sm:w-auto min-h-[44px]"
                  >
                    Buat Laporan Baru
                  </button>
                </div>
              </div>

              <div
                className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
                role="group"
                aria-label="Ringkasan status laporan"
              >
                {STATUS_FILTERS.map((st) => {
                  const active = statusFilter === st;
                  const label = st === 'ALL' ? 'Semua laporan' : STATUS_LABEL[st] || st;
                  const tone = active
                    ? 'border-brand-700 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/80'
                    : 'border-ink-200 dark:border-ink-800 hover:border-ink-400 dark:hover:border-ink-600';
                  return (
                    <button
                      key={st}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setStatusFilter(active && st !== 'ALL' ? 'ALL' : st)}
                      className={`min-h-[44px] w-full rounded-xl border ${tone} p-3 text-left transition-colors cursor-pointer`}
                    >
                      <span className="block text-xs font-semibold text-ink-600 dark:text-ink-300">{label}</span>
                      <span className="mt-0.5 block text-2xl font-extrabold font-mono text-ink-900 dark:text-white">
                        {counts[st] ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label htmlFor="search-reports" className="label">Cari laporan</label>
                  <input
                    id="search-reports"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari judul atau deskripsi"
                    autoComplete="off"
                    className="field"
                  />
                </div>
                <div className="sm:w-48">
                  <label htmlFor="sort-reports" className="label">Urutkan</label>
                  <select
                    id="sort-reports"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="field"
                  >
                    <option value="upvotes">Dukungan terbanyak</option>
                    <option value="newest">Terbaru</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter kategori">
                {CATEGORY_FILTERS.map((cat) => {
                  const active = categoryFilter === cat;
                  const label = cat === 'ALL' ? 'Semua' : CATEGORY_LABEL[cat] || cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategoryFilter(cat)}
                      className="chip cat-pill min-h-[44px] cursor-pointer"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5">
                {reportsLoading && reports.length === 0 ? (
                  <div className="state-box" role="status">
                    <strong>Memuat daftar laporan</strong>
                    Mengambil laporan fasilitas kampus terkini...
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="state-box">
                    <strong>Tidak ada laporan yang cocok dengan filter saat ini</strong>
                    Ubah kata kunci pencarian atau reset filter status dan kategori untuk melihat laporan lain.
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('ALL');
                          setCategoryFilter('ALL');
                          setSearchQuery('');
                        }}
                        className="btn btn-sm btn-ghost min-h-[44px]"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                    {filteredReports.map((rep) => (
                      <ReportCard
                        key={rep.id}
                        report={rep}
                        isUpvoted={upvotedIds.has(String(rep.id))}
                        showUpvote={true}
                        showTracking={false}
                        onOpenDetail={handleOpenDetail}
                        onToggleUpvote={handleToggleUpvote}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <div id="page-lapor" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Kolom kiri: Peta Lokasi Kerusakan */}
            <div ref={mapSectionRef} className="lg:col-span-6 card p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="text-lg sm:text-xl font-extrabold text-ink-900 dark:text-white">
                    Pilih lokasi kerusakan
                  </h1>
                  <p className="hint">Klik peta atau gunakan GPS.</p>
                </div>
                <button
                  id="btn-use-gps"
                  type="button"
                  disabled={gpsLoading}
                  onClick={handleUseGps}
                  className="btn btn-sm btn-ghost w-full sm:w-auto sm:shrink-0 min-h-[44px]"
                >
                  <svg className="w-4 h-4 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <span>{gpsLoading ? 'Mencari GPS...' : 'Gunakan Lokasi GPS Saya'}</span>
                </button>
              </div>

              <div className="relative mt-3 rounded-lg border border-ink-200 dark:border-ink-800 overflow-hidden bg-ink-100 dark:bg-ink-900">
                <CampusMap
                  reports={reports}
                  selectedCoords={selectedCoords}
                  focusTarget={mapFocusTarget}
                  visible={activeView === 'lapor'}
                  interactiveTarget={true}
                  onSelectCoords={(lat, lng) => setSelectedCoords(lat, lng)}
                  onSelectReport={(rep, el) => handleOpenDetail(rep.id, el)}
                />
                <div className="absolute bottom-2 left-2 z-20 rounded-md bg-ink-50 dark:bg-ink-900 px-2.5 py-1 border border-ink-200 dark:border-ink-700 text-xs font-mono text-ink-700 dark:text-ink-200">
                  Pin:{' '}
                  <strong>
                    {Number(selectedCoords?.lat ?? -6.4092).toFixed(5)},{' '}
                    {Number(selectedCoords?.lng ?? 108.2825).toFixed(5)}
                  </strong>
                </div>
              </div>

              <div className="mt-4">
                <p className="label">Titik cepat di kampus</p>
                <div className="flex flex-wrap gap-2">
                  {CAMPUS_PLACES.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handlePresetClick(place)}
                      className="chip min-h-[44px] cursor-pointer"
                    >
                      {place.short}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-ink-200 dark:border-ink-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-ink-600 dark:text-ink-300">Lihat &amp; dukung laporan lainnya</p>
                <button
                  type="button"
                  onClick={() => navigateSection('papan')}
                  className="btn btn-sm btn-ghost w-full sm:w-auto sm:shrink-0 min-h-[44px]"
                >
                  Buka Papan Laporan
                </button>
              </div>
            </div>

            {/* Kolom kanan: Form Pelaporan Baru */}
            <div className="lg:col-span-6">
              <ReportForm key={formResetKey} />
            </div>
          </div>
        )}
      </section>

      <ReportDetailDialog
        report={selectedReport}
        isUpvoted={selectedReport ? upvotedIds.has(String(selectedReport.id)) : false}
        showUpvote={true}
        onClose={handleCloseDetail}
        onFocusMap={handleFocusMap}
        onToggleUpvote={(id) => toggleUpvoteReport(id, { allowToggle: true })}
      />

      <DuplicateModal
        prompt={duplicatePrompt}
        onUpvoteExisting={handleDuplicateUpvote}
        onForceSubmit={handleDuplicateForceSubmit}
        onClose={closeDuplicatePrompt}
      />
    </main>
  );
}
