import { useMemo, useRef, useState } from 'react';
import { STATUS_LABEL } from '../lib/badges.js';
import { ReportCard } from './ReportCard.jsx';

const TABS = [
  { id: 'mine', label: 'Laporan saya' },
  { id: 'updates', label: 'Pembaruan' },
  { id: 'supported', label: 'Didukung' },
];

const STATUS_CHIPS = [
  { key: 'ALL', label: 'Semua' },
  { key: 'Received', label: STATUS_LABEL.Received || 'Diterima' },
  { key: 'In Progress', label: STATUS_LABEL['In Progress'] || 'Diperbaiki' },
  { key: 'Resolved', label: STATUS_LABEL.Resolved || 'Selesai' },
];

function isUserReport(report, session) {
  if (!report || !session) return false;
  const sid = String(session.id || '');
  if (!sid) return false;
  return String(report.user_id ?? report.reporter_id ?? '') === sid;
}

function formatDateTime(value) {
  const t = Date.parse(value);
  if (!Number.isFinite(t)) return '';
  return new Date(t).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MyReportsView({
  session,
  reports,
  upvotedIds,
  onOpenDetail,
  onToggleUpvote,
  onNavigateSection,
}) {
  const [activeTab, setActiveTab] = useState('mine');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const tabRefs = useRef({});

  const ownReports = useMemo(
    () => reports.filter((r) => isUserReport(r, session)),
    [reports, session]
  );

  const supportedReports = useMemo(
    () => reports.filter((r) => upvotedIds.has(String(r.id))),
    [reports, upvotedIds]
  );

  const updates = useMemo(() => {
    const entries = [];
    ownReports.forEach((rep) => {
      (Array.isArray(rep.status_history) ? rep.status_history : []).forEach((h) => {
        if (h && h.to && Number.isFinite(Date.parse(h.at))) {
          entries.push({ rep, h });
        }
      });
    });
    return entries.sort((a, b) => Date.parse(b.h.at) - Date.parse(a.h.at));
  }, [ownReports]);

  const tabCounts = {
    mine: ownReports.length,
    updates: updates.length,
    supported: supportedReports.length,
  };

  const handleTabKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const idx = TABS.findIndex((t) => t.id === activeTab);
    const nextIdx = (idx + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
    const nextTab = TABS[nextIdx].id;
    setActiveTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  const handleStatusSelect = (key) => {
    setStatusFilter(key);
    if (activeTab !== 'mine') setActiveTab('mine');
  };

  const visibleItems = useMemo(() => {
    const base = activeTab === 'supported' ? supportedReports : ownReports;
    const q = searchQuery.trim().toLowerCase();
    const filtered = activeTab === 'mine'
      ? base.filter((r) => {
          const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
          const matchQuery =
            !q ||
            String(r.title || '').toLowerCase().includes(q) ||
            String(r.description || '').toLowerCase().includes(q);
          return matchStatus && matchQuery;
        })
      : base;

    return [...filtered].sort((a, b) =>
      sortBy === 'upvotes' && activeTab === 'mine'
        ? (b.upvotes || 0) - (a.upvotes || 0)
        : Date.parse(b.created_at) - Date.parse(a.created_at)
    );
  }, [activeTab, supportedReports, ownReports, searchQuery, statusFilter, sortBy]);

  const isFilteredMine = activeTab === 'mine' && (statusFilter !== 'ALL' || searchQuery.trim() !== '');

  return (
    <section id="page-laporan-saya" className="card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-ink-200 dark:border-ink-800 px-3 sm:px-5 pt-1 sm:pt-0 pb-2.5 sm:pb-0">
        <div
          role="tablist"
          aria-label="Laporan saya"
          onKeyDown={handleTabKeyDown}
          className="flex w-full sm:w-auto overflow-x-auto no-scrollbar border-b sm:border-b-0 border-ink-200 dark:border-ink-800 -mx-3 px-3 sm:mx-0 sm:px-0"
        >
          {TABS.map((t) => {
            const selected = t.id === activeTab;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el;
                }}
                id={`myreports-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="myreports-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(t.id)}
                className="tab min-h-[44px] cursor-pointer"
              >
                {t.label} ({tabCounts[t.id]})
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:my-2">
          <button
            type="button"
            onClick={() => onNavigateSection?.('lapor')}
            className="btn btn-sm btn-ghost w-full sm:w-auto min-h-[44px]"
          >
            Kembali ke Peta &amp; Lapor
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection?.('lapor')}
            className="btn btn-sm btn-primary w-full sm:w-auto min-h-[44px]"
          >
            Buat Laporan Baru
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-ink-900 dark:text-white">Laporan saya</h1>
        <p className="hint">Laporan yang Anda kirim, progres pengerjaannya, dan laporan yang Anda dukung.</p>

        <div
          className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3"
          role="group"
          aria-label="Filter status laporan saya"
        >
          {STATUS_CHIPS.map(({ key, label }) => {
            const count = key === 'ALL' ? ownReports.length : ownReports.filter((r) => r.status === key).length;
            const active = statusFilter === key;
            const tone = active
              ? 'border-brand-700 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/80'
              : 'border-ink-200 dark:border-ink-800 hover:border-ink-400 dark:hover:border-ink-600';
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => handleStatusSelect(key)}
                className={`min-h-[44px] w-full rounded-xl border ${tone} p-3 text-left transition-colors cursor-pointer`}
              >
                <span className="block text-xs font-semibold text-ink-600 dark:text-ink-300">
                  {key === 'ALL' ? 'Semua laporan' : label}
                </span>
                <span className="mt-0.5 block text-2xl font-extrabold font-mono text-ink-900 dark:text-white">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {activeTab === 'mine' && (
          <div className="mt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label htmlFor="myreports-search" className="label">Cari laporan</label>
                <input
                  id="myreports-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="field"
                  placeholder="Cari judul atau deskripsi"
                  autoComplete="off"
                />
              </div>
              <div className="sm:w-48">
                <label htmlFor="myreports-sort" className="label">Urutkan</label>
                <select
                  id="myreports-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="field"
                >
                  <option value="newest">Terbaru</option>
                  <option value="upvotes">Dukungan terbanyak</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter status">
              {STATUS_CHIPS.map(({ key, label }) => {
                const count = key === 'ALL' ? ownReports.length : ownReports.filter((r) => r.status === key).length;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={statusFilter === key}
                    onClick={() => handleStatusSelect(key)}
                    className="chip min-h-[44px] cursor-pointer"
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div
          id="myreports-panel"
          role="tabpanel"
          aria-labelledby={`myreports-tab-${activeTab}`}
          className="mt-5"
        >
          {activeTab === 'updates' ? (
            updates.length === 0 ? (
              <div className="state-box">
                <strong>Belum ada perubahan status</strong>
                Saat petugas Sarpras memperbarui status laporan Anda, perubahannya muncul di sini.
              </div>
            ) : (
              <ol className="card divide-y divide-ink-200 dark:divide-ink-800">
                {updates.map(({ rep, h }, idx) => (
                  <li
                    key={`${rep.id}-${h.at}-${idx}`}
                    className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3"
                  >
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={(e) => onOpenDetail?.(rep.id, e.currentTarget)}
                        className="text-left text-sm font-bold text-ink-900 dark:text-white truncate hover:underline cursor-pointer"
                      >
                        {rep.title}
                      </button>
                      <p className="text-sm text-ink-600 dark:text-ink-300">
                        Status menjadi <strong>{STATUS_LABEL[h.to] || h.to}</strong>
                      </p>
                    </div>
                    <time
                      dateTime={h.at}
                      className="text-xs text-ink-600 dark:text-ink-300 shrink-0"
                    >
                      {formatDateTime(h.at)}
                    </time>
                  </li>
                ))}
              </ol>
            )
          ) : visibleItems.length === 0 ? (
            activeTab === 'supported' ? (
              <div className="state-box">
                <strong>Belum ada laporan yang Anda dukung</strong>
                Buka Papan Laporan, lalu tekan Dukung pada laporan yang juga Anda temui di kampus.
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => onNavigateSection?.('papan')}
                    className="btn btn-sm btn-primary min-h-[44px]"
                  >
                    Buka Papan Laporan
                  </button>
                </div>
              </div>
            ) : isFilteredMine && ownReports.length > 0 ? (
              <div className="state-box">
                <strong>Tidak ada laporan yang cocok</strong>
                Ubah kata pencarian atau pilih status lain untuk melihat laporan Anda.
              </div>
            ) : (
              <div className="state-box">
                <strong>Anda belum mengirim laporan</strong>
                Pilih lokasi di peta, isi formulir, lalu kirim. Progres pengerjaan muncul di sini dan di detail laporan.
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => onNavigateSection?.('lapor')}
                    className="btn btn-sm btn-primary min-h-[44px]"
                  >
                    Buat Laporan Baru
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {visibleItems.map((rep) => (
                <ReportCard
                  key={rep.id}
                  report={rep}
                  isUpvoted={upvotedIds.has(String(rep.id))}
                  showUpvote={activeTab === 'supported'}
                  showTracking={false}
                  onOpenDetail={onOpenDetail}
                  onToggleUpvote={onToggleUpvote}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
