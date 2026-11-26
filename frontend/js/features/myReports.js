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
  { id: 'updates', label: 'Pembaruan' },
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

// Perubahan status nyata dari status_history laporan milik user, terbaru di atas
function collectUpdates(own) {
  const entries = [];
  own.forEach((rep) => {
    (Array.isArray(rep.status_history) ? rep.status_history : []).forEach((h) => {
      if (h && h.to && Number.isFinite(Date.parse(h.at))) entries.push({ rep, h });
    });
  });
  return entries.sort((a, b) => Date.parse(b.h.at) - Date.parse(a.h.at));
}

function renderUpdatesTimeline(updates) {
  if (updates.length === 0) {
    return `
      <div class="state-box">
        <strong>Belum ada perubahan status</strong>
        Saat petugas Sarpras memperbarui status laporan Anda, perubahannya muncul di sini.
      </div>`;
  }
  return `<ol class="card divide-y divide-ink-200 dark:divide-ink-800">${updates
    .map(
      ({ rep, h }) => `
      <li class="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
        <div class="min-w-0">
          <p class="text-sm font-bold text-ink-900 dark:text-white truncate">${escapeHtml(rep.title)}</p>
          <p class="text-sm text-ink-600 dark:text-ink-300">Status menjadi <strong>${escapeHtml(STATUS_LABEL[h.to] || h.to)}</strong></p>
        </div>
        <time datetime="${escapeHtml(h.at)}" class="text-xs text-ink-600 dark:text-ink-300 shrink-0">${escapeHtml(formatDateTime(h.at))}</time>
      </li>`
    )
    .join('')}</ol>`;
}

// Ringkasan milik user yang sedang masuk (bukan total kampus); tiap kartu menjadi filter status.
function renderSummary(own) {
  const el = document.getElementById('myreports-summary');
  if (!el) return;
  el.innerHTML = STATUS_CHIPS.map(({ key, label }) => {
    const count = key === 'ALL' ? own.length : own.filter((r) => r.status === key).length;
    const active = statusFilter === key;
    const tone = active
      ? 'border-brand-700 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/80'
      : 'border-ink-200 dark:border-ink-800 hover:border-ink-400 dark:hover:border-ink-600';
    return `
      <button type="button" data-myreports-status="${escapeHtml(key)}" aria-pressed="${active}"
        class="min-h-[44px] w-full rounded-xl border ${tone} p-3 text-left">
        <span class="block text-xs font-semibold text-ink-600 dark:text-ink-300">${escapeHtml(key === 'ALL' ? 'Semua laporan' : label)}</span>
        <span class="mt-0.5 block text-2xl font-extrabold font-mono text-ink-900 dark:text-white">${count}</span>
      </button>`;
  }).join('');
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

// Render hanya saat halaman Laporan Saya terbuka; fokus keyboard dipertahankan setelah aksi pada kartu.
export function renderMyReports() {
  const page = document.getElementById('page-laporan-saya');
  if (page && page.classList.contains('hidden')) return;

  const panel = document.getElementById('myreports-panel');
  const active = document.activeElement;
  let key = null;
  if (panel && active && panel.contains(active)) {
    const actionEl = active.closest('[data-action]');
    if (actionEl) key = { action: actionEl.dataset.action, id: actionEl.dataset.id };
  }

  renderMyReportsContent();

  if (!key || !panel) return;
  const next = [...panel.querySelectorAll('[data-action]')].find(
    (el) => el.dataset.action === key.action && el.dataset.id === key.id
  );
  if (next) {
    next.focus();
  } else {
    // Kartu hilang (misalnya batal dukungan di tab Didukung): fokus pindah ke panel
    panel.setAttribute('tabindex', '-1');
    panel.focus();
  }
}

function renderMyReportsContent() {
  const tabsEl = document.getElementById('myreports-tabs');
  const panel = document.getElementById('myreports-panel');
  if (!tabsEl || !panel) return;

  // Daftar disaring sekali per render
  const own = ownReports();
  const supported = supportedReports();
  const updates = collectUpdates(own);
  const counts = { mine: own.length, updates: updates.length, supported: supported.length };

  renderSummary(own);
  tabsEl.innerHTML = TABS.map((t) => {
    const selected = t.id === activeTab;
    return `<button id="myreports-tab-${t.id}" type="button" role="tab" aria-selected="${selected}" aria-controls="myreports-panel" tabindex="${selected ? 0 : -1}" data-myreports-tab="${t.id}" class="tab">${escapeHtml(t.label)} (${counts[t.id]})</button>`;
  }).join('');
  panel.setAttribute('aria-labelledby', `myreports-tab-${activeTab}`);

  // Toolbar hanya untuk tab Laporan saya
  const toolbar = document.getElementById('myreports-toolbar');
  if (toolbar) toolbar.classList.toggle('hidden', activeTab !== 'mine');

  if (activeTab === 'updates') {
    panel.innerHTML = renderUpdatesTimeline(updates);
    return;
  }

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

  // Kartu ringkasan dan chip status memakai state filter yang sama
  const onStatusClick = (event) => {
    const btn = event.target.closest('[data-myreports-status]');
    if (!btn) return;
    const container = btn.parentElement?.id;
    statusFilter = btn.dataset.myreportsStatus;
    if (activeTab !== 'mine') activeTab = 'mine';
    renderMyReports();
    document
      .querySelector(`#${container} [data-myreports-status="${statusFilter}"]`)
      ?.focus();
  };
  document.getElementById('myreports-status-chips')?.addEventListener('click', onStatusClick);
  document.getElementById('myreports-summary')?.addEventListener('click', onStatusClick);
  document.getElementById('myreports-search')?.addEventListener('input', renderMyReports);
  document.getElementById('myreports-sort')?.addEventListener('change', renderMyReports);
}
