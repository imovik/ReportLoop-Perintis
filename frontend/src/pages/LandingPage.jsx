import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { CATEGORY_LABEL, STATUS_LABEL, getStatusBadgeClass } from '../lib/badges.js';
import { getPlaceName } from '../lib/places.js';
import { useScrollReveal } from '../hooks/useScrollReveal.js';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { AppFooter } from '../components/AppFooter.jsx';
import { ReportDetailDialog } from '../components/ReportDetailDialog.jsx';

const WORKFLOW_STEPS = [
  {
    code: '01 / LOKASI',
    title: 'Sematkan Titik Peta',
    body: 'Tandai koordinat lokasi kerusakan langsung pada peta kampus Polindra atau gunakan GPS perangkat Anda.',
    icon: (
      <svg className="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
  },
  {
    code: '02 / BUKTI & NLP',
    title: 'Klasifikasi Otomatis NLP',
    body: 'Ambil foto kondisi terkini dan tulis keluhan singkat; sistem otomatis mengelompokkan divisi penanganan.',
    icon: (
      <svg className="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
      </svg>
    ),
  },
  {
    code: '03 / PRIORITAS',
    title: 'Triase & Upvote Kolektif',
    body: 'Laporan serupa di radius 15 meter digabung lewat +1 Upvote agar Sarpras menangani masalah paling mendesak lebih dulu.',
    icon: (
      <svg className="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
      </svg>
    ),
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const session = useAppStore((s) => s.session);
  const reports = useAppStore((s) => s.reports);
  const reportsLoading = useAppStore((s) => s.reportsLoading);
  const upvotedIds = useAppStore((s) => s.upvotedIds);
  const toggleUpvoteReport = useAppStore((s) => s.toggleUpvoteReport);
  const focusMapOn = useAppStore((s) => s.focusMapOn);
  const pushToast = useAppStore((s) => s.pushToast);

  const [activeStep, setActiveStep] = useState(0);
  const [throwDir, setThrowDir] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const trackRef = useRef(null);
  const dragRef = useRef({ down: false, pointerId: null, startX: 0, startY: 0, dx: 0, horizontal: null });
  const animatingRef = useRef(false);
  const throwTimerRef = useRef(null);
  const containerRef = useScrollReveal([reports.length]);

  const counts = useMemo(() => {
    let received = 0;
    let progress = 0;
    let resolved = 0;
    for (const r of reports) {
      if (r.status === 'Received') received += 1;
      else if (r.status === 'In Progress') progress += 1;
      else if (r.status === 'Resolved') resolved += 1;
    }
    return { received, progress, resolved };
  }, [reports]);

  const featuredReports = useMemo(() => reports.slice(0, 6), [reports]);

  const selectedReport = useMemo(
    () => reports.find((r) => String(r.id) === String(selectedReportId)) || null,
    [reports, selectedReportId]
  );

  const isAdmin = session?.role === 'admin';
  const isUser = session?.role === 'user';
  const workspaceHref = isAdmin ? '/admin#antrean' : isUser ? '/user#lapor' : '/masuk';
  const navCtaLabel = isAdmin ? 'Buka Panel Admin' : isUser ? 'Buka Beranda Mahasiswa' : 'Masuk Mahasiswa';
  const navCtaShort = isAdmin ? 'Panel' : isUser ? 'Beranda' : 'Masuk';
  const heroCtaLabel = isAdmin ? 'Buka Panel Admin' : isUser ? 'Buka Beranda Mahasiswa' : 'Buat Laporan Mahasiswa';

  useEffect(() => () => window.clearTimeout(throwTimerRef.current), []);

  const getTopCard = () => trackRef.current?.querySelector('[data-stack-pos="0"]') ?? null;

  const resetTopCard = () => {
    const card = getTopCard();
    if (!card) return;
    card.classList.remove('is-dragging-top');
    card.style.transform = '';
    card.style.opacity = '';
  };

  const cycleCard = (direction) => {
    const total = WORKFLOW_STEPS.length;
    if (animatingRef.current || total < 2) return;
    const nextIdx = (activeStep + (direction === 'prev' ? -1 : 1) + total) % total;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    resetTopCard();
    if (reduceMotion) {
      setActiveStep(nextIdx);
      return;
    }

    animatingRef.current = true;
    setThrowDir(direction === 'prev' ? 'right' : 'left');
    throwTimerRef.current = window.setTimeout(() => {
      setActiveStep(nextIdx);
      setThrowDir(null);
      animatingRef.current = false;
    }, 260);
  };

  const goStep = (nextIdx) => {
    if (animatingRef.current) return;
    const total = WORKFLOW_STEPS.length;
    const normalized = ((nextIdx % total) + total) % total;
    if (normalized === activeStep) return;
    resetTopCard();
    setActiveStep(normalized);
  };

  const handleStepKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      cycleCard('next');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      cycleCard('prev');
    }
  };

  const handleDotKeyDown = (e, idx) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const total = WORKFLOW_STEPS.length;
    const next = (idx + (e.key === 'ArrowRight' ? 1 : -1) + total) % total;
    e.currentTarget.parentElement?.children[next]?.focus();
    goStep(next);
  };

  const handlePointerDown = (e) => {
    if (animatingRef.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    dragRef.current = {
      down: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
      horizontal: null,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const d = dragRef.current;
    if (!d.down || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (d.horizontal === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      d.horizontal = Math.abs(dx) >= Math.abs(dy);
    }
    if (!d.horizontal) return;
    d.dx = dx;

    const card = getTopCard();
    if (!card) return;
    card.classList.add('is-dragging-top');
    const rotateDeg = Math.max(-12, Math.min(12, dx * 0.045));
    card.style.transform = `translate3d(${dx}px, ${Math.abs(dx) * -0.04}px, 0) rotate(${rotateDeg}deg)`;
  };

  const releasePointer = (e) => {
    const d = dragRef.current;
    if (!d.down || e.pointerId !== d.pointerId) return;
    d.down = false;
    const track = e.currentTarget;
    if (track.hasPointerCapture(d.pointerId)) track.releasePointerCapture(d.pointerId);
    setIsDragging(false);

    const threshold = Math.min(95, track.clientWidth * 0.22);
    if (d.horizontal && Math.abs(d.dx) >= threshold) {
      cycleCard(d.dx < 0 ? 'next' : 'prev');
      return;
    }
    resetTopCard();
  };

  const handleUpvoteClick = async (reportId) => {
    if (!session) {
      pushToast('Silakan masuk menggunakan akun mahasiswa untuk memberi dukungan.', 'info');
      navigate('/masuk');
      return;
    }
    if (session.role === 'admin') {
      pushToast('Akun petugas Sarpras tidak memberi dukungan laporan.', 'info');
      return;
    }
    await toggleUpvoteReport(reportId);
  };

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-200 dark:border-ink-800 bg-ink-50/95 dark:bg-ink-950/95 safe-top">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 rounded-lg min-w-0 shrink">
            <span className="w-9 h-9 rounded-lg bg-brand-700 dark:bg-brand-600 text-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </span>
            <div className="min-w-0">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-ink-900 dark:text-white block leading-none whitespace-nowrap">ReportLoop</span>
              <span className="text-[10px] sm:text-[11px] font-medium text-ink-600 dark:text-ink-300 block mt-0.5 truncate">Politeknik Negeri Indramayu</span>
            </div>
          </Link>

          <nav aria-label="Navigasi halaman utama" className="hidden md:flex items-center gap-1">
            <a
              href="#alur-pelaporan"
              className="px-3.5 py-2.5 min-h-[44px] inline-flex items-center rounded-lg text-sm font-semibold text-ink-600 dark:text-ink-300 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-ink-800 transition-colors"
            >
              Alur Kerja
            </a>
            <a
              href="#peran-sistem"
              className="px-3.5 py-2.5 min-h-[44px] inline-flex items-center rounded-lg text-sm font-semibold text-ink-600 dark:text-ink-300 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-ink-800 transition-colors"
            >
              Peran Pengguna
            </a>
            <a
              href="#papan-publik"
              className="px-3.5 py-2.5 min-h-[44px] inline-flex items-center rounded-lg text-sm font-semibold text-ink-600 dark:text-ink-300 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-ink-800 transition-colors"
            >
              Papan Laporan
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ThemeToggle variant="ghost" />
            <Link to={workspaceHref} aria-label={navCtaLabel} className="btn btn-primary min-h-[44px] whitespace-nowrap px-4 text-sm">
              <span className="sm:hidden">{navCtaShort}</span>
              <span className="hidden sm:inline">{navCtaLabel}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Split Hero dengan Pratinjau Antarmuka Nyata */}
        <section className="relative overflow-hidden border-b border-ink-200 dark:border-ink-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Sisi Kiri: Fokus Tipografi & Aksi */}
              <div className="lg:col-span-6 space-y-6">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink-900 dark:text-white leading-[1.15]">
                  Laporkan Kerusakan Fasilitas Kampus{' '}
                  <span className="text-brand-700 dark:text-brand-400 block sm:inline">Dari Titik Lokasinya.</span>
                </h1>

                <p className="text-base sm:text-lg text-ink-600 dark:text-ink-300 leading-relaxed max-w-xl">
                  Tandai titik kerusakan di peta Polindra, ambil foto langsung, dan pantau penanganannya.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <Link to={workspaceHref} className="btn btn-primary px-6 text-base min-h-[44px]">
                    {heroCtaLabel}
                  </Link>
                  <a href="#papan-publik" className="btn btn-ghost px-5 text-base min-h-[44px]">
                    Lihat Papan Laporan
                  </a>
                </div>

                <p className="text-xs sm:text-sm text-ink-600 dark:text-ink-400">
                  Belum memiliki akun kampus?{' '}
                  <Link to="/daftar" className="font-semibold text-brand-700 dark:text-brand-400 underline underline-offset-2">
                    Daftar menggunakan NIM
                  </Link>
                </p>
              </div>

              {/* Sisi Kanan: Pratinjau Sistem di atas Bidang Aksen Biru */}
              <div className="lg:col-span-6 relative">
                <div className="rounded-2xl bg-brand-700 dark:bg-brand-900/70 p-4 sm:p-6 border border-brand-800 dark:border-brand-700">
                  <div className="card p-4 sm:p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-ink-200 dark:border-ink-800">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink-600 dark:text-ink-300">Pratinjau Triase Kampus Polindra</p>
                        <p className="font-mono text-xs text-brand-700 dark:text-brand-400 mt-0.5 flex flex-wrap gap-x-2">
                          <span className="whitespace-nowrap">-6.40850, 108.28150</span>
                          <span className="whitespace-nowrap">Radius Duplikat 15 m</span>
                        </p>
                      </div>
                      <span className="badge badge-progress shrink-0 whitespace-nowrap">Diperbaiki</span>
                    </div>

                    <div className="rounded-lg bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800 p-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 basis-40">
                          <span className="badge badge-cat whitespace-nowrap">Infrastruktur</span>
                          <h2 className="mt-2 text-base font-bold text-ink-900 dark:text-white">Lampu lorong lantai 2 padam</h2>
                          <p className="mt-1 text-xs text-ink-600 dark:text-ink-300">Prediksi divisi otomatis oleh NLP</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-700 px-2.5 py-1.5 text-xs font-bold text-brand-700 dark:text-brand-400">
                            Dukungan warga
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
                      <div className="rounded-lg border border-ink-200 dark:border-ink-800 p-2.5 bg-ink-50 dark:bg-ink-900/60">
                        <span className="block text-lg font-extrabold text-ink-900 dark:text-white font-mono">{counts.received}</span>
                        <span className="text-xs text-ink-600 dark:text-ink-300">Diterima</span>
                      </div>
                      <div className="rounded-lg border border-ink-200 dark:border-ink-800 p-2.5 bg-ink-50 dark:bg-ink-900/60">
                        <span className="block text-lg font-extrabold text-brand-700 dark:text-brand-400 font-mono">{counts.progress}</span>
                        <span className="text-[11px] sm:text-xs text-ink-600 dark:text-ink-300 whitespace-nowrap">Diperbaiki</span>
                      </div>
                      <div className="rounded-lg border border-ink-200 dark:border-ink-800 p-2.5 bg-ink-50 dark:bg-ink-900/60">
                        <span className="block text-lg font-extrabold text-green-700 dark:text-green-400 font-mono">{counts.resolved}</span>
                        <span className="text-xs text-ink-600 dark:text-ink-300">Selesai</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Alur Pelaporan 3 Tahap (Tumpukan Kartu Swipe Sentuh & Seret Mouse) */}
        <section id="alur-pelaporan" aria-labelledby="steps-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6" data-reveal>
            <h2 id="steps-heading" className="text-2xl sm:text-3xl font-extrabold text-ink-900 dark:text-white tracking-tight">
              3 Langkah Pelaporan Terstruktur
            </h2>
            <p className="text-sm text-ink-600 dark:text-ink-300">
              Geser kartu untuk menelusuri alur pelaporan.
            </p>
          </div>

          <div className="steps-stack-stage" data-reveal>
            <div
              ref={trackRef}
              tabIndex={0}
              role="region"
              aria-roledescription="tumpukan kartu"
              aria-labelledby="steps-heading"
              onKeyDown={handleStepKeyDown}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={releasePointer}
              onPointerCancel={releasePointer}
              onDragStart={(e) => e.preventDefault()}
              className={`steps-track${isDragging ? ' is-dragging' : ''}`}
            >
              {WORKFLOW_STEPS.map((step, idx) => {
                const n = WORKFLOW_STEPS.length;
                const rel = (idx - activeStep + n) % n;
                const isFront = rel === 0;
                return (
                  <article
                    key={step.code}
                    data-stack-pos={rel}
                    aria-current={isFront ? 'step' : undefined}
                    aria-hidden={isFront ? undefined : true}
                    className={`step-card card p-6 sm:p-7 flex flex-col justify-between gap-5${isFront && throwDir ? ` is-throwing-${throwDir}` : ''}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400">
                          {step.icon}
                        </span>
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300">
                          {step.code}
                        </span>
                      </div>
                      <h3 className="mt-5 text-lg sm:text-xl font-bold text-ink-900 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm text-ink-600 dark:text-ink-300 leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-4 sm:mt-5 flex items-center justify-center gap-3">
              <div className="flex items-center" role="tablist" aria-label="Pilih langkah pelaporan">
                {WORKFLOW_STEPS.map((step, idx) => {
                  const active = idx === activeStep;
                  return (
                    <button
                      key={step.code}
                      type="button"
                      role="tab"
                      tabIndex={active ? 0 : -1}
                      aria-label={`Langkah ${idx + 1}: ${step.title}`}
                      aria-selected={active}
                      onClick={() => goStep(idx)}
                      onKeyDown={(e) => handleDotKeyDown(e, idx)}
                      className={`step-dot-btn ${active ? 'is-active' : ''}`}
                    >
                      <span className="step-dot-pill" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Penjelasan Peran Pengguna */}
        <section id="peran-sistem" className="border-y border-ink-200 dark:border-ink-800 bg-ink-50/70 dark:bg-ink-900/50 py-10 sm:py-12" data-reveal>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 items-stretch">
            <div className="card p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div>
                <span className="badge badge-cat">Untuk Mahasiswa</span>
                <h2 className="mt-3 text-xl sm:text-2xl font-extrabold text-ink-900 dark:text-white">
                  Pelaporan Cepat &amp; Dukungan Suara
                </h2>
                <ul className="mt-4 space-y-3 text-sm text-ink-600 dark:text-ink-300">
                  <li className="flex items-start gap-2.5">
                    <svg className="w-5 h-5 text-brand-700 dark:text-brand-400 shrink-0 mt-0.5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span>Masuk menggunakan NIM untuk mencatat identitas pelapor dan mencegah spam.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <svg className="w-5 h-5 text-brand-700 dark:text-brand-400 shrink-0 mt-0.5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span>Tentukan lokasi lewat klik peta kampus, preset gedung, atau GPS perangkat.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <svg className="w-5 h-5 text-brand-700 dark:text-brand-400 shrink-0 mt-0.5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span>Pantau status perbaikan dari Diterima hingga Selesai secara terbuka.</span>
                  </li>
                </ul>
              </div>
              <div>
                <Link to={isUser ? '/user#lapor' : '/masuk'} className="btn btn-primary w-full sm:w-auto min-h-[44px]">
                  {isUser ? 'Buka Beranda Mahasiswa' : 'Masuk sebagai Mahasiswa'}
                </Link>
              </div>
            </div>

            <div className="card p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div>
                <span className="badge badge-cat">Untuk Unit Sarpras</span>
                <h2 className="mt-3 text-xl sm:text-2xl font-extrabold text-ink-900 dark:text-white">
                  Antrean Triase Berbasis Prioritas
                </h2>
                <ul className="mt-4 space-y-3 text-sm text-ink-600 dark:text-ink-300">
                  <li className="flex items-start gap-2.5">
                    <svg className="w-5 h-5 text-brand-700 dark:text-brand-400 shrink-0 mt-0.5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span>Daftar keluhan otomatis diurutkan dari jumlah dukungan terbanyak.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <svg className="w-5 h-5 text-brand-700 dark:text-brand-400 shrink-0 mt-0.5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span>Filter antrean berdasarkan divisi hasil NLP dan status pengerjaan.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <svg className="w-5 h-5 text-brand-700 dark:text-brand-400 shrink-0 mt-0.5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span>Perbarui status perbaikan satu klik dan periksa titik lokasi di peta.</span>
                  </li>
                </ul>
              </div>
              <p className="text-xs font-medium text-ink-500 dark:text-ink-400">
                Akses triase tersedia melalui portal internal unit Sarpras.
              </p>
            </div>
          </div>
        </section>

        {/* Pratinjau Papan Laporan Publik Nyata */}
        <section id="papan-publik" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14" data-reveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-900 dark:text-white tracking-tight">
                Papan Laporan Fasilitas Terkini
              </h2>
              <p className="mt-1 text-sm sm:text-base text-ink-600 dark:text-ink-300">
                Pantau laporan aktif atau masuk untuk memberi dukungan.
              </p>
            </div>
            <Link to={isUser ? '/user#papan' : '/masuk'} className="btn btn-ghost shrink-0 min-h-[44px]">
              {isUser ? 'Buka Papan Laporan Lengkap' : 'Masuk untuk Memberi Dukungan'}
            </Link>
          </div>

          {reportsLoading ? (
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
              <div className="card state-box col-span-full" role="status">Memuat daftar laporan kampus...</div>
            </div>
          ) : featuredReports.length === 0 ? (
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
              <div className="card state-box col-span-full">
                <strong>Belum ada laporan aktif</strong>
                Jadilah mahasiswa pertama yang melaporkan kondisi fasilitas kampus.
              </div>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
              {featuredReports.map((r) => {
                const upvoted = upvotedIds.has(String(r.id));
                return (
                  <article key={r.id} className="card p-3 sm:p-5 flex flex-col justify-between gap-3 sm:gap-4">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                        <span className="badge badge-cat">{CATEGORY_LABEL[r.category] || r.category}</span>
                        <span className={getStatusBadgeClass(r.status)}>{STATUS_LABEL[r.status] || r.status}</span>
                      </div>
                      <h3 className="mt-2.5 sm:mt-3 text-sm sm:text-lg font-bold text-ink-900 dark:text-white leading-snug">
                        <button
                          type="button"
                          onClick={() => setSelectedReportId(r.id)}
                          className="text-left hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 cursor-pointer"
                        >
                          {r.title}
                        </button>
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm text-ink-600 dark:text-ink-300 leading-relaxed line-clamp-3">
                        {r.description}
                      </p>
                    </div>

                    <div className="pt-2.5 sm:pt-3 border-t border-ink-200 dark:border-ink-800 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 text-xs text-ink-600 dark:text-ink-300">
                        <span className="inline-flex items-center gap-1 font-semibold text-ink-900 dark:text-white min-w-0">
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
                          <span className="truncate">{getPlaceName(r)}</span>
                        </span>
                        <span className="font-bold text-brand-700 dark:text-brand-400 shrink-0">
                          +{Number(r.upvotes || 0)} Dukungan
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedReportId(r.id)}
                          className="btn btn-sm btn-ghost flex-1 min-h-[44px] cursor-pointer"
                        >
                          Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpvoteClick(r.id)}
                          aria-pressed={upvoted}
                          className={`btn btn-sm flex-1 min-h-[44px] cursor-pointer ${upvoted ? 'btn-primary' : 'btn-ghost'}`}
                        >
                          {upvoted ? 'Didukung' : '+1 Dukungan'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Banner Aksi Penutup */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16" data-reveal>
          <div className="rounded-2xl bg-brand-700 dark:bg-brand-900 text-white p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ada fasilitas kampus yang rusak?
              </h2>
              <p className="mt-2 text-sm sm:text-base text-blue-100">
                Laporkan langsung dari titik lokasinya.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link to={workspaceHref} className="btn bg-ink-50 text-brand-800 hover:bg-blue-50 px-6 min-h-[44px]">
                {isAdmin ? 'Buka Panel Admin' : isUser ? 'Buat Laporan Sekarang' : 'Buat Laporan Baru'}
              </Link>
              {!session && (
                <Link to="/daftar" className="btn border border-white/40 text-white hover:bg-white/10 px-5 min-h-[44px]">
                  Daftar Akun NIM
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <AppFooter />

      <ReportDetailDialog
        report={selectedReport}
        isUpvoted={selectedReport ? upvotedIds.has(String(selectedReport.id)) : false}
        showUpvote={!isAdmin}
        onClose={() => setSelectedReportId(null)}
        onFocusMap={(lat, lng) => {
          setSelectedReportId(null);
          focusMapOn(lat, lng, 18);
          navigate(isAdmin ? '/admin#peta' : isUser ? '/user#lapor' : '/masuk');
        }}
        onToggleUpvote={handleUpvoteClick}
      />
    </div>
  );
}
