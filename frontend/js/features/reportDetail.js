// Dialog detail laporan: foto besar, deskripsi lengkap, lokasi, riwayat status, dan dukungan.
// Dibuka dari kartu lewat data-action="open-detail" (lihat main.js). Memakai <dialog> native.

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

let dialogEl = null;
let lastTrigger = null;

function resolvePhotoSrc(rep) {
  if (!rep.photo_url) return null;
  return rep.photo_url.startsWith('/uploads') ? `${FASTAPI_BASE_URL}${rep.photo_url}` : rep.photo_url;
}

function formatLong(value) {
  const t = Date.parse(value);
  if (!Number.isFinite(t)) return '';
  return new Date(t).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
}

function ensureDialog() {
  if (dialogEl) return dialogEl;
  dialogEl = document.createElement('dialog');
  dialogEl.setAttribute('aria-labelledby', 'report-detail-title');
  dialogEl.className =
    'm-auto w-[min(94vw,42rem)] max-h-[90vh] overflow-y-auto rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-0 text-ink-900 dark:text-white backdrop:bg-ink-950/60';
  document.body.appendChild(dialogEl);

  dialogEl.addEventListener('click', (event) => {
    // Klik pada latar gelap (di luar kotak dialog) menutup dialog
    if (event.target === dialogEl) {
      dialogEl.close();
      return;
    }
    // Tombol aksi (dukung, lihat di peta) ditangani main.js; dialog ditutup agar perubahan di daftar terlihat
    if (event.target.closest('[data-action]') || event.target.closest('[data-detail-close]')) {
      dialogEl.close();
    }
  });
  dialogEl.addEventListener('close', () => {
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    lastTrigger = null;
  });
  return dialogEl;
}

function detailRow(label, valueHtml) {
  return `
    <div class="py-3 flex items-start justify-between gap-4">
      <dt class="text-ink-600 dark:text-ink-300 shrink-0">${escapeHtml(label)}</dt>
      <dd class="font-semibold text-ink-900 dark:text-white text-right min-w-0">${valueHtml}</dd>
    </div>`;
}

function historyHtml(rep) {
  const list = Array.isArray(rep.status_history) ? rep.status_history : [];
  if (list.length === 0) return '';
  const items = [...list]
    .reverse()
    .map(
      (h) =>
        `<li class="flex items-center justify-between gap-3 text-sm"><span class="font-semibold text-ink-900 dark:text-white">${escapeHtml(STATUS_LABEL[h.to] || h.to)}</span><span class="text-xs text-ink-600 dark:text-ink-400">${escapeHtml(formatLong(h.at))}</span></li>`
    )
    .join('');
  return `
    <section>
      <h3 class="text-sm font-bold text-ink-900 dark:text-white">Riwayat status</h3>
      <ul class="mt-2 space-y-2">${items}</ul>
    </section>`;
}

export function openReportDetail(id, trigger) {
  const rep = state.reports.find((r) => String(r.id) === String(id));
  if (!rep) return;
  const dialog = ensureDialog();
  lastTrigger = trigger || null;

  const photo = resolvePhotoSrc(rep);
  const isUpvoted = state.upvotedIds.has(rep.id);
  const created = formatLong(rep.created_at);

  dialog.innerHTML = `
    ${
      photo
        ? `<img src="${escapeHtml(photo)}" alt="Foto laporan: ${escapeHtml(rep.title)}" width="640" height="360" class="w-full max-h-72 object-cover" />`
        : getPhotoPlaceholderSvg(rep.category)
    }
    <div class="p-5 sm:p-6 space-y-5">
      <div class="flex flex-wrap items-center gap-2">
        <span class="${getStatusBadgeClass(rep.status)}">${escapeHtml(STATUS_LABEL[rep.status] || rep.status)}</span>
        <span class="${getCategoryBadgeClass(rep.category)}">${escapeHtml(CATEGORY_LABEL[rep.category] || rep.category)}</span>
      </div>

      <div>
        <h2 id="report-detail-title" class="text-xl font-extrabold text-ink-900 dark:text-white leading-snug">${escapeHtml(rep.title)}</h2>
        <p class="mt-2 text-sm text-ink-600 dark:text-ink-300 leading-relaxed whitespace-pre-line">${escapeHtml(rep.description)}</p>
      </div>

      <dl class="divide-y divide-ink-200 dark:divide-ink-800 border-y border-ink-200 dark:border-ink-800 text-sm">
        ${detailRow('Lokasi', escapeHtml(getPlaceName(rep)))}
        ${created ? detailRow('Dilaporkan', escapeHtml(created)) : ''}
        ${detailRow('ID laporan', `<span class="font-mono">#${escapeHtml(String(rep.id).slice(0, 8))}</span>`)}
        ${detailRow('Dukungan', `${escapeHtml(String(rep.upvotes))} dukungan`)}
      </dl>

      ${renderAdminTracking(rep)}
      ${historyHtml(rep)}

      <div class="flex flex-col sm:flex-row gap-2">
        <button type="button" data-action="focus-map" data-lat="${escapeHtml(rep.latitude)}" data-lng="${escapeHtml(rep.longitude)}" class="btn btn-ghost w-full sm:w-auto">Lihat di Peta</button>
        <button type="button" data-action="upvote" data-id="${escapeHtml(rep.id)}" aria-pressed="${isUpvoted}" class="btn w-full sm:flex-1 ${isUpvoted ? 'btn-primary' : 'btn-ghost'}">${isUpvoted ? 'Batalkan dukungan' : 'Dukung laporan ini'}</button>
        <button type="button" data-detail-close class="btn btn-ghost w-full sm:w-auto" aria-label="Kembali dari detail laporan">Kembali</button>
      </div>
    </div>
  `;

  dialog.showModal();
  dialog.scrollTop = 0;
}
