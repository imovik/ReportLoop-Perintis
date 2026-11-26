// Halaman Laporan Saya: ringkasan aktivitas per user dan dua tab (Laporan saya, Didukung).
// Tab Laporan saya punya pencarian, urutan, dan chip status. Progres 3 tahap ada di dialog detail.
// Data dihitung dari state.reports dan state.upvotedIds, tanpa data karangan.
// Kartu laporan sama dengan kartu Papan Laporan (renderReportCard di publicBoard.js).

import { state } from '../state/store.js';
import { getSession } from '../services/auth.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { STATUS_LABEL } from '../utils/badges.js';
import { renderReportCard, isUserReport } from './publicBoard.js';

const TABS = [
  { id: 'mine', label: 'Laporan saya' },
  { id: 'supported', label: 'Didukung' },
];

const STATUS_CHIPS = [
  { key: 'ALL', label: 'Semua' },
  { key: 'Received', label: STATUS_LABEL.Received || 'Diterima' },
  { key: 'In Progress', label: STATUS_LABEL['In Progress'] || 'Diperbaiki' },
  { key: 'Resolved', label: STATUS_LABEL.Resolved || 'Selesai' },
];

// Laporan sendiri tidak perlu tombol Dukung; tab Didukung memberi Batalkan dukungan.
const CARD_OPTIONS = {
  mine: { showUpvote: false },
  supported: { showUpvote: true },
};

let activeTab = 'mine';
let statusFilter = 'ALL';

function ownReports() {
  const session = getSession();
  return state.reports.filter((r) => isUserReport(r, session));
}

function supportedReports() {
  return state.reports.filter((r) => state.upvotedIds.has(r.id));
}

function summaryCell(label, value, tone) {
  return `
    <div class="rounded-xl border border-ink-200 dark:border-ink-800 p-3 sm:p-4">
      <dt class="text-xs font-semibold text-ink-600 dark:text-ink-300">${escapeHtml(label)}</dt>
      <dd class="mt-1 text-2xl font-extrabold font-mono ${tone}">${value}</dd>
    </div>`;
}

// Ringkasan aktivitas milik user yang sedang masuk, bukan total seluruh kampus.
function renderSummary(own) {
  const el = document.getElementById('myreports-summary');
  if (!el) return;
  const count = (status) => own.filter((r) => r.status === status).length;
  const received = own.reduce((sum, r) => sum + (Number(r.upvotes) || 0), 0);
  const plain = 'text-ink-900 dark:text-white';
  el.innerHTML = [
    summaryCell('Laporan saya', own.length, plain),
    summaryCell('Diterima', count('Received'), plain),
    summaryCell('Diperbaiki', count('In Progress'), 'text-brand-700 dark:text-brand-400'),
    summaryCell('Selesai', count('Resolved'), 'text-green-700 dark:text-green-400'),
    summaryCell('Dukungan diterima', received, plain),
    summaryCell('Laporan didukung', state.upvotedIds.size, plain),
  ].join('');
}

function renderStatusChips(own) {
  const el = document.getElementById('myreports-status-chips');
  if (!el) return;
  el.innerHTML = STATUS_CHIPS.map(({ key, label }) => {
    const count = key === 'ALL' ? own.length : own.filter((r) => r.status === key).length;
    return `<button type="button" class="chip" data-myreports-status="${escapeHtml(key)}" aria-pressed="${statusFilter === key}">${escapeHtml(label)} (${count})</button>`;
  }).join('');
}

function emptyState(tab, filtered) {
  if (tab === 'supported') {
    return {
      title: 'Belum ada laporan yang Anda dukung',
      body: 'Buka Papan Laporan, lalu tekan Dukung pada laporan yang juga Anda temui di kampus.',
      action: { view: 'papan', label: 'Buka Papan Laporan' },
    };
  }
  if (filtered) {
    return {
      title: 'Tidak ada laporan yang cocok',
      body: 'Ubah kata pencarian atau pilih status lain untuk melihat laporan Anda.',
      action: null,
    };
  }
  return {
    title: 'Anda belum mengirim laporan',
    body: 'Pilih lokasi di peta, isi formulir, lalu kirim. Progres pengerjaan muncul di sini dan di detail laporan.',
    action: { view: 'lapor', label: 'Buat Laporan Baru' },
  };
}

export function setMyReportsTab(tab) {
  if (!TABS.some((t) => t.id === tab)) return;
  activeTab = tab;
  renderMyReports();
}

export function renderMyReports() {
  const tabsEl = document.getElementById('myreports-tabs');
  const panel = document.getElementById('myreports-panel');
  if (!tabsEl || !panel) return;

  // Daftar disaring sekali per render
  const own = ownReports();
  const supported = supportedReports();
  const counts = { mine: own.length, supported: supported.length };

  renderSummary(own);
  tabsEl.innerHTML = TABS.map((t) => {
    const selected = t.id === activeTab;
    return `<button id="myreports-tab-${t.id}" type="button" role="tab" aria-selected="${selected}" aria-controls="myreports-panel" tabindex="${selected ? 0 : -1}" data-myreports-tab="${t.id}" class="tab">${escapeHtml(t.label)} (${counts[t.id]})</button>`;
  }).join('');
  panel.setAttribute('aria-labelledby', `myreports-tab-${activeTab}`);

  // Toolbar hanya untuk tab Laporan saya
  const toolbar = document.getElementById('myreports-toolbar');
  if (toolbar) toolbar.classList.toggle('hidden', activeTab !== 'mine');

  let items = activeTab === 'supported' ? supported : own;
  const sortBy = document.getElementById('myreports-sort')?.value || 'newest';
  let filtered = false;

  if (activeTab === 'mine') {
    renderStatusChips(own);
    const query = (document.getElementById('myreports-search')?.value || '').trim().toLowerCase();
    filtered = statusFilter !== 'ALL' || query !== '';
    items = items.filter((r) => {
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchQuery =
        !query || r.title.toLowerCase().includes(query) || r.description.toLowerCase().includes(query);
      return matchStatus && matchQuery;
    });
  }

  if (items.length === 0) {
    const msg = emptyState(activeTab, filtered && own.length > 0);
    panel.innerHTML = `
      <div class="state-box">
        <strong>${escapeHtml(msg.title)}</strong>
        ${escapeHtml(msg.body)}
        ${msg.action ? `<div class="mt-3"><button type="button" data-nav-view="${msg.action.view}" class="btn btn-sm btn-primary">${escapeHtml(msg.action.label)}</button></div>` : ''}
      </div>`;
    return;
  }

  const sorted = [...items].sort((a, b) =>
    sortBy === 'upvotes' && activeTab === 'mine'
      ? (b.upvotes || 0) - (a.upvotes || 0)
      : Date.parse(b.created_at) - Date.parse(a.created_at)
  );
  const options = CARD_OPTIONS[activeTab];
  panel.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">${sorted
    .map((rep) => renderReportCard(rep, options))
    .join('')}</div>`;
}

export function bindMyReportsEvents() {
  const tabsEl = document.getElementById('myreports-tabs');
  if (!tabsEl) return;

  tabsEl.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-myreports-tab]');
    if (btn) setMyReportsTab(btn.dataset.myreportsTab);
  });

  // Panah kiri/kanan memindah tab, sesuai pola tablist
  tabsEl.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const idx = TABS.findIndex((t) => t.id === activeTab);
    const next = (idx + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
    setMyReportsTab(TABS[next].id);
    document.getElementById(`myreports-tab-${TABS[next].id}`)?.focus();
  });

  document.getElementById('myreports-status-chips')?.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-myreports-status]');
    if (!chip) return;
    statusFilter = chip.dataset.myreportsStatus;
    renderMyReports();
    document.querySelector(`[data-myreports-status="${statusFilter}"]`)?.focus();
  });
  document.getElementById('myreports-search')?.addEventListener('input', renderMyReports);
  document.getElementById('myreports-sort')?.addEventListener('change', renderMyReports);
}
