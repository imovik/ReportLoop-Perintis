// Dialog detail laporan: dibuka dari kartu mana pun (Papan Laporan dan Laporan Saya).
// Menampilkan deskripsi lengkap, nama tempat, riwayat status, dan aksi yang sama dengan kartu.

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
import { renderAdminTracking } from './publicBoard.js';

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

function resolvePhoto(rep) {
  if (!rep.photo_url) return null;
  return rep.photo_url.startsWith('/uploads') ? `${FASTAPI_BASE_URL}${rep.photo_url}` : rep.photo_url;
}

function renderHistory(rep) {
  const history = Array.isArray(rep.status_history) ? rep.status_history : [];
  if (history.length === 0) {
    return `<p class="text-sm text-ink-600 dark:text-ink-300">Belum ada perubahan status. Laporan masih berstatus ${escapeHtml(STATUS_LABEL[rep.status] || rep.status)}.</p>`;
  }
  return `<ol class="divide-y divide-ink-200 dark:divide-ink-800 text-sm">${history
    .map(
      (h) => `
      <li class="py-2 flex items-center justify-between gap-3">
        <span class="font-semibold text-ink-900 dark:text-white">${escapeHtml(STATUS_LABEL[h.to] || h.to)}</span>
        <span class="text-xs text-ink-600 dark:text-ink-300">${escapeHtml(formatDateTime(h.at))}</span>
      </li>`
    )
    .join('')}</ol>`;
}

export function openReportDetail(id, { showUpvote = true } = {}) {
  const rep = state.reports.find((r) => String(r.id) === String(id));
  if (!rep) return;

  document.getElementById('report-detail-dialog')?.remove();

  const photo = resolvePhoto(rep);
  const isUpvoted = state.upvotedIds.has(rep.id);
  const maxUpvotes = Math.max(...state.reports.map((r) => r.upvotes), 0);
  const pct = maxUpvotes ? Math.round((rep.upvotes / maxUpvotes) * 100) : 0;
  const dialog = document.createElement('dialog');
  dialog.id = 'report-detail-dialog';
  dialog.setAttribute('aria-labelledby', 'report-detail-title');
  dialog.className =
    'card p-0 m-auto w-[min(36rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-1.5rem)] overflow-y-auto text-ink-900 dark:text-white backdrop:bg-black/40';
  dialog.innerHTML = `
    ${
      photo
        ? `<img src="${escapeHtml(photo)}" alt="Foto laporan: ${escapeHtml(rep.title)}" width="640" height="360" class="w-full h-48 object-cover" />`
        : getPhotoPlaceholderSvg(rep.category)
    }
    <div class="p-4 sm:p-5 space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="${getStatusBadgeClass(rep.status)}">${escapeHtml(STATUS_LABEL[rep.status] || rep.status)}</span>
            <span class="${getCategoryBadgeClass(rep.category)}">${escapeHtml(CATEGORY_LABEL[rep.category] || rep.category)}</span>
          </div>
          <h2 id="report-detail-title" class="mt-2 text-lg font-extrabold leading-snug">${escapeHtml(rep.title)}</h2>
        </div>
        <button type="button" id="report-detail-close" aria-label="Tutup detail laporan" class="btn btn-sm btn-ghost shrink-0">Tutup</button>
      </div>

      <p class="text-sm text-ink-700 dark:text-ink-200 leading-relaxed whitespace-pre-line">${escapeHtml(rep.description)}</p>

      <dl class="divide-y divide-ink-200 dark:divide-ink-800 border-y border-ink-200 dark:border-ink-800 text-sm">
        <div class="py-2.5 flex items-center justify-between gap-3"><dt class="text-ink-600 dark:text-ink-300">Tempat</dt><dd class="font-semibold text-right">${escapeHtml(getPlaceName(rep))}</dd></div>
        <div class="py-2.5 flex items-center justify-between gap-3"><dt class="text-ink-600 dark:text-ink-300">Dikirim</dt><dd class="font-semibold text-right">${escapeHtml(formatDateTime(rep.created_at))}</dd></div>
        <div class="py-2.5 flex items-center justify-between gap-3"><dt class="text-ink-600 dark:text-ink-300">ID laporan</dt><dd class="font-mono text-xs font-semibold">#${escapeHtml(String(rep.id).slice(0, 8))}</dd></div>
        <div class="py-2.5 flex items-center justify-between gap-3"><dt class="text-ink-600 dark:text-ink-300">Dukungan</dt><dd class="font-semibold">${rep.upvotes}</dd></div>
      </dl>

      <div class="meter" role="img" aria-label="Dukungan ${pct} persen dari laporan paling didukung"><span style="width:${pct}%"></span></div>

      ${renderAdminTracking(rep)}

      <div>
        <h3 class="text-sm font-bold">Riwayat status</h3>
        <div class="mt-1">${renderHistory(rep)}</div>
      </div>

      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button type="button" data-action="focus-map" data-lat="${escapeHtml(rep.latitude)}" data-lng="${escapeHtml(rep.longitude)}" class="btn btn-ghost w-full sm:w-auto">Lihat di Peta</button>
        ${
          showUpvote
            ? `<button type="button" data-action="upvote" data-id="${escapeHtml(rep.id)}" aria-pressed="${isUpvoted}" class="btn w-full sm:w-auto ${isUpvoted ? 'btn-primary' : 'btn-ghost'}">${isUpvoted ? 'Batalkan dukungan' : 'Dukung laporan ini'}</button>`
            : ''
        }
      </div>
    </div>
  `;
  document.body.appendChild(dialog);

  const close = () => {
    if (dialog.open) dialog.close();
    dialog.remove();
  };
  dialog.querySelector('#report-detail-close').addEventListener('click', close);
  // Klik di luar panel (pada backdrop) menutup dialog
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  // Aksi Lihat di Peta dan Dukung ditangani delegasi global di main.js, dialog ditutup sesudahnya
  dialog.addEventListener('click', (e) => {
    if (e.target.closest('[data-action]')) setTimeout(close, 0);
  });
  dialog.addEventListener('close', () => dialog.remove());

  dialog.showModal();
}
