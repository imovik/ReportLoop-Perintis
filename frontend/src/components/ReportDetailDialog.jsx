import { useEffect, useRef } from 'react';
import { FASTAPI_BASE_URL } from '../config/constants.js';
import { getPlaceName } from '../lib/places.js';
import {
  getCategoryBadgeClass,
  getStatusBadgeClass,
  STATUS_LABEL,
  CATEGORY_LABEL,
} from '../lib/badges.js';
import { AdminTrackingBox } from './AdminTrackingBox.jsx';

function formatLongDate(value) {
  const t = Date.parse(value);
  if (!Number.isFinite(t)) return '';
  return new Date(t).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
}

export function ReportDetailDialog({
  report,
  isUpvoted = false,
  showUpvote = true,
  onClose,
  onFocusMap,
  onToggleUpvote,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (report) {
      if (!dialog.open) {
        dialog.showModal();
      }
      dialog.scrollTop = 0;
    } else if (dialog.open) {
      dialog.close();
    }
  }, [report]);

  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose?.();
    }
  };

  const photo = report?.photo_url
    ? report.photo_url.startsWith('/uploads')
      ? `${FASTAPI_BASE_URL}${report.photo_url}`
      : report.photo_url
    : null;

  const created = report ? formatLongDate(report.created_at) : '';
  const historyList = Array.isArray(report?.status_history) ? [...report.status_history].reverse() : [];
  const catText = report ? CATEGORY_LABEL[report.category] || report.category : '';
  const latNum = Number(report?.latitude);
  const lngNum = Number(report?.longitude);
  const hasCoords = Number.isFinite(latNum) && Number.isFinite(lngNum);
  const coordsLabel = hasCoords ? `${latNum.toFixed(5)}, ${lngNum.toFixed(5)}` : '';

  const handleJumpToMap = () => {
    if (!hasCoords) return;
    onClose?.();
    onFocusMap?.(latNum, lngNum);
  };

  return (
    <dialog
      ref={dialogRef}
      id="report-detail-dialog"
      aria-labelledby="report-detail-title"
      onClose={() => onClose?.()}
      onClick={handleBackdropClick}
      className="m-auto w-[min(94vw,42rem)] max-h-[90vh] overflow-y-auto rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-0 text-ink-900 dark:text-white backdrop:bg-ink-950/60"
    >
      {report && (
        <>
          {photo ? (
            <img
              src={photo}
              alt={`Foto laporan: ${report.title}`}
              width="640"
              height="360"
              className="w-full max-h-72 object-cover"
            />
          ) : (
            <div className="w-full h-24 sm:h-32 flex flex-col items-center justify-center px-3 sm:px-4 text-center bg-ink-100 dark:bg-ink-800/80 text-ink-700 dark:text-ink-300 border-b border-ink-200 dark:border-ink-800">
              <span className="text-xs sm:text-sm font-bold">{catText}</span>
              <span className="text-[11px] sm:text-xs mt-0.5">Belum ada foto</span>
            </div>
          )}

          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={getStatusBadgeClass(report.status)}>
                {STATUS_LABEL[report.status] || report.status}
              </span>
              <span className={getCategoryBadgeClass(report.category)}>{catText}</span>
            </div>

            <div>
              <h2
                id="report-detail-title"
                className="text-xl font-extrabold text-ink-900 dark:text-white leading-snug"
              >
                {report.title}
              </h2>
              <p className="mt-2 text-sm text-ink-600 dark:text-ink-300 leading-relaxed whitespace-pre-line">
                {report.description}
              </p>
            </div>

            <dl className="divide-y divide-ink-200 dark:divide-ink-800 border-y border-ink-200 dark:border-ink-800 text-sm">
              <div className="py-3 flex items-start justify-between gap-4">
                <dt className="text-ink-600 dark:text-ink-300 shrink-0">Lokasi</dt>
                <dd className="font-semibold text-ink-900 dark:text-white text-right min-w-0">
                  {getPlaceName(report)}
                </dd>
              </div>
              {hasCoords && (
                <div className="py-2 flex items-center justify-between gap-4">
                  <dt className="text-ink-600 dark:text-ink-300 shrink-0">Koordinat</dt>
                  <dd className="text-right min-w-0">
                    <button
                      type="button"
                      onClick={handleJumpToMap}
                      aria-label={`Buka lokasi koordinat ${coordsLabel} di peta kampus`}
                      className="inline-flex items-center justify-end min-h-[44px] px-2 -mr-2 rounded-lg font-mono text-xs sm:text-sm font-semibold text-brand-700 dark:text-brand-400 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 cursor-pointer"
                    >
                      {coordsLabel}
                    </button>
                  </dd>
                </div>
              )}
              {created && (
                <div className="py-3 flex items-start justify-between gap-4">
                  <dt className="text-ink-600 dark:text-ink-300 shrink-0">Dilaporkan</dt>
                  <dd className="font-semibold text-ink-900 dark:text-white text-right min-w-0">
                    {created}
                  </dd>
                </div>
              )}
              <div className="py-3 flex items-start justify-between gap-4">
                <dt className="text-ink-600 dark:text-ink-300 shrink-0">ID laporan</dt>
                <dd className="font-semibold text-ink-900 dark:text-white text-right min-w-0">
                  <span className="font-mono">#{String(report.id).slice(0, 8)}</span>
                </dd>
              </div>
              <div className="py-3 flex items-start justify-between gap-4">
                <dt className="text-ink-600 dark:text-ink-300 shrink-0">Dukungan</dt>
                <dd className="font-semibold text-ink-900 dark:text-white text-right min-w-0">
                  {report.upvotes} dukungan
                </dd>
              </div>
            </dl>

            <AdminTrackingBox report={report} />

            {historyList.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-ink-900 dark:text-white">Riwayat status</h3>
                <ul className="mt-2 space-y-2">
                  {historyList.map((h, idx) => (
                    <li key={`${h.at}-${idx}`} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-ink-900 dark:text-white">
                        {STATUS_LABEL[h.to] || h.to}
                      </span>
                      <span className="text-xs text-ink-600 dark:text-ink-400">
                        {formatLongDate(h.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleJumpToMap}
                className="btn btn-ghost w-full sm:w-auto"
              >
                Lihat di Peta
              </button>

              {showUpvote && (
                <button
                  type="button"
                  aria-pressed={isUpvoted}
                  onClick={() => {
                    const id = report.id;
                    onClose?.();
                    onToggleUpvote?.(id);
                  }}
                  className={`btn w-full sm:flex-1 ${isUpvoted ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {isUpvoted ? 'Batalkan dukungan' : 'Dukung laporan ini'}
                </button>
              )}

              <button
                type="button"
                onClick={() => onClose?.()}
                className="btn btn-ghost w-full sm:w-auto"
                aria-label="Kembali dari detail laporan"
              >
                Kembali
              </button>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
