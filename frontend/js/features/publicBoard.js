// Fitur papan laporan kampus: kartu ringkasan status, kartu laporan, filter kategori, pencarian, dan pengurutan.

import { FASTAPI_BASE_URL } from '../config/constants.js';
import { state } from '../state/store.js';
import { getPlaceName } from '../services/places.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import {
  getCategoryBadgeClass,
  getStatusBadgeClass,
  getPhotoPlaceholderSvg,
  STATUS_LABEL,
  CATEGORY_LABEL,
} from '../utils/badges.js';

let statusFilter = 'ALL';

export function setFilterCategory(cat) {
  state.activeCategoryFilter = cat;
  document.querySelectorAll('.cat-pill').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.cat === cat));
  });
  renderPublicBoard();
}

export function setStatusFilter(next) {
  statusFilter = next;
  renderPublicBoard();
}

export function isUserReport(rep, session) {
  if (!session || !session.id) return false;
  const ownerId = rep.user_id ?? rep.reporter_nim ?? rep.nim ?? null;
  return ownerId !== null && String(ownerId) === String(session.id);
}

function emptyMessage() {
  if (state.reports.length === 0) {
    return {
      title: 'Belum ada laporan di kampus',
      body: 'Jadilah yang pertama: pilih lokasi di peta, isi formulir, lalu kirim laporan.',
    };
  }
  return {
    title: 'Tidak ada laporan yang cocok',
    body: 'Ubah kata pencarian atau lepas filter kategori dan status untuk melihat lebih banyak laporan.',
  };
}

export function renderLoading() {
  const grid = document.getElementById('public-reports-grid');
  if (!grid) return;
  grid.setAttribute('aria-busy', 'true');
  grid.innerHTML = [1, 2, 3, 4]
    .map(
      () => `
      <div class="card p-3 sm:p-4 space-y-2.5" aria-hidden="true">
        <div class="skeleton h-5 w-2/3"></div>
        <div class="skeleton h-4 w-1/2"></div>
        <div class="skeleton h-14 w-full"></div>
      </div>`
    )
    .join('');
}

export function renderLoadError(retry) {
  const grid = document.getElementById('public-reports-grid');
  if (!grid) return;
  grid.removeAttribute('aria-busy');
  grid.innerHTML = `
    <div class="col-span-full state-box">
      <strong>Laporan gagal dimuat</strong>
      Periksa koneksi Anda, lalu coba lagi.
      <div class="mt-3"><button type="button" id="btn-retry-load" class="btn btn-ghost btn-sm">Muat ulang laporan</button></div>
    </div>`;
  const btn = document.getElementById('btn-retry-load');
  if (btn && retry) btn.addEventListener('click', retry);
}

const SUMMARY_CARDS = [
  { key: 'ALL', label: 'Semua laporan' },
  { key: 'Received', label: STATUS_LABEL.Received || 'Diterima' },
  { key: 'In Progress', label: STATUS_LABEL['In Progress'] || 'Diperbaiki' },
  { key: 'Resolved', label: STATUS_LABEL.Resolved || 'Selesai' },
];

function renderStatusSummary() {
  const wrap = document.getElementById('status-summary');
  if (!wrap) return;
  wrap.innerHTML = SUMMARY_CARDS.map(({ key, label }) => {
    const count = key === 'ALL' ? state.reports.length : state.reports.filter((r) => r.status === key).length;
    const active = statusFilter === key;
    const tone = active
      ? 'border-brand-700 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/80'
      : 'border-ink-200 dark:border-ink-800 hover:border-ink-400 dark:hover:border-ink-600';
    return `
      <button type="button" data-status-key="${escapeHtml(key)}" aria-pressed="${active}"
        class="min-h-[44px] w-full rounded-xl border ${tone} p-3 text-left">
        <span class="block text-xs font-semibold text-ink-600 dark:text-ink-300">${escapeHtml(label)}</span>
        <span class="mt-0.5 block text-2xl font-extrabold font-mono text-ink-900 dark:text-white">${count}</span>
      </button>`;
  }).join('');
}

export function renderPublicBoard() {
  const grid = document.getElementById('public-reports-grid');
  if (!grid) return;
  grid.removeAttribute('aria-busy');

  renderStatusSummary();
  const sortBy = document.getElementById('sort-reports').value;
  const query = document.getElementById('search-reports').value.trim().toLowerCase();

  const filtered = state.reports.filter((r) => {
    const matchCat = state.activeCategoryFilter === 'ALL' || r.category === state.activeCategoryFilter;
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchQuery =
      !query || r.title.toLowerCase().includes(query) || r.description.toLowerCase().includes(query);
    return matchCat && matchStatus && matchQuery;
  });

  if (sortBy === 'upvotes') {
    filtered.sort((a, b) => b.upvotes - a.upvotes);
  } else {
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const summary = document.getElementById('board-summary');
  if (summary) {
    summary.textContent = `Menampilkan ${filtered.length} dari ${state.reports.length} laporan.`;
  }

  if (filtered.length === 0) {
    const msg = emptyMessage();
    grid.innerHTML = `
      <div class="col-span-full state-box">
        <strong>${msg.title}</strong>
        ${msg.body}
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((rep) => renderReportCard(rep)).join('');
}

const TRACK_STEPS = [
  { key: 'Received', label: '1. Diterima' },
  { key: 'In Progress', label: '2. Diperbaiki' },
  { key: 'Resolved', label: '3. Selesai' },
];

function stepIndexForStatus(status) {
  if (status === 'Resolved') return 2;
  if (status === 'In Progress') return 1;
  return 0;
}

function formatTrackDate(value) {
  const t = Date.parse(value);
  if (!Number.isFinite(t)) return '';
  return new Date(t).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function renderAdminTracking(rep) {
  const activeIdx = stepIndexForStatus(rep.status);
  const stepsHtml = TRACK_STEPS.map((st, idx) => {
    const cls = idx < activeIdx ? 'track-step is-done' : idx === activeIdx ? 'track-step is-current' : 'track-step';
    return `
      <div class="${cls}">
        <div class="track-bar" aria-hidden="true"></div>
        <span class="track-label">${escapeHtml(st.label)}</span>
      </div>
    `;
  }).join('');

  const latest = Array.isArray(rep.status_history) && rep.status_history.length > 0
    ? rep.status_history[rep.status_history.length - 1]
    : null;
  const latestToLabel = latest ? (STATUS_LABEL[latest.to] || latest.to) : '';
  const latestWhen = latest ? formatTrackDate(latest.at) : '';
  const historyHtml = latest
    ? `<p class="mt-2 border-t border-ink-200 dark:border-ink-800 pt-2 text-xs text-ink-600 dark:text-ink-300">Status ke <strong>${escapeHtml(latestToLabel)}</strong> oleh Admin${latestWhen ? ` (${escapeHtml(latestWhen)})` : ''}</p>`
    : '';

  return `
    <div class="track-box" aria-label="Progres pengerjaan admin">
      <div class="flex items-center justify-between gap-2 mb-2">
        <span class="text-xs font-bold text-ink-900 dark:text-white">Progres admin</span>
        <span class="text-xs font-semibold text-ink-600 dark:text-ink-300">${escapeHtml(STATUS_LABEL[rep.status] || rep.status)}</span>
      </div>
      <div class="track-steps">${stepsHtml}</div>
      ${historyHtml}
    </div>
  `;
}

export function renderReportCard(rep, { showUpvote = true, showTracking = false } = {}) {
  const isUpvoted = state.upvotedIds.has(rep.id);
  const resolvedPhotoSrc = rep.photo_url
    ? rep.photo_url.startsWith('/uploads')
      ? `${FASTAPI_BASE_URL}${rep.photo_url}`
      : rep.photo_url
    : null;

  const statusText = STATUS_LABEL[rep.status] || rep.status;
  const catText = CATEGORY_LABEL[rep.category] || rep.category;

  return `
    <article class="card overflow-hidden flex flex-col relative">
      ${
        resolvedPhotoSrc
          ? `<img src="${escapeHtml(resolvedPhotoSrc)}" alt="Foto laporan: ${escapeHtml(rep.title)}" width="640" height="360" class="w-full h-24 sm:h-32 object-cover" loading="lazy" decoding="async" />`
          : getPhotoPlaceholderSvg(rep.category)
      }

      <div class="p-3 sm:p-4 flex-1 flex flex-col gap-2 sm:gap-3">
        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span class="${getStatusBadgeClass(rep.status)}">${statusText}</span>
          <span class="${getCategoryBadgeClass(rep.category)}">${catText}</span>
        </div>

        <div>
          <h3 class="text-sm sm:text-base font-bold text-ink-900 dark:text-white leading-snug">
            <button type="button" data-action="open-detail" data-id="${escapeHtml(rep.id)}" data-show-upvote="${showUpvote}" aria-label="Lihat detail laporan ${escapeHtml(rep.title)}" class="text-left hover:underline after:absolute after:inset-0 after:content-['']">${escapeHtml(rep.title)}</button>
          </h3>
        </div>

        <p class="flex items-start gap-1.5 text-xs sm:text-sm font-semibold text-ink-900 dark:text-white">
          <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mt-0.5 text-brand-700 dark:text-brand-400" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <span class="min-w-0">${escapeHtml(getPlaceName(rep))}</span>
        </p>

        <div class="mt-auto flex flex-col gap-2 sm:gap-3 relative z-10">
        ${showTracking ? renderAdminTracking(rep) : ''}

        <p class="border-t border-ink-200 dark:border-ink-800 pt-2 sm:pt-3 text-xs sm:text-sm font-semibold text-ink-900 dark:text-white">${rep.upvotes} dukungan</p>

        ${showUpvote ? `<button
          type="button"
          data-action="upvote"
          data-id="${escapeHtml(rep.id)}"
          aria-pressed="${isUpvoted}"
          aria-label="${isUpvoted ? 'Batalkan dukungan' : 'Dukung'} laporan ${escapeHtml(rep.title)}, ${rep.upvotes} dukungan"
          class="btn btn-sm sm:min-h-[44px] w-full px-2.5 sm:px-4 text-xs sm:text-sm ${isUpvoted ? 'btn-primary' : 'btn-ghost'}"
        >${isUpvoted ? 'Batalkan dukungan' : 'Dukung laporan'}</button>` : ''}
        </div>
      </div>
    </article>
  `;
}

export function bindBoardEvents() {
  document.querySelectorAll('.cat-pill').forEach((btn) => {
    btn.addEventListener('click', () => setFilterCategory(btn.dataset.cat));
  });
  document.getElementById('status-summary')?.addEventListener('click', (event) => {
    const card = event.target.closest('[data-status-key]');
    if (!card) return;
    // Klik kartu yang sedang aktif mengembalikan ke semua laporan
    const key = card.dataset.statusKey;
    setStatusFilter(statusFilter === key ? 'ALL' : key);
  });
  document.getElementById('sort-reports').addEventListener('change', renderPublicBoard);
  document.getElementById('search-reports').addEventListener('input', renderPublicBoard);
}
