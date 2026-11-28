import { useEffect, useState } from 'react';
import { FASTAPI_BASE_URL } from '../config/constants.js';
import { getPlaceName } from '../lib/places.js';
import {
  getCategoryBadgeClass,
  getStatusBadgeClass,
  STATUS_LABEL,
  CATEGORY_LABEL,
} from '../lib/badges.js';
import { AdminTrackingBox } from './AdminTrackingBox.jsx';

export function ReportCard({
  report,
  isUpvoted = false,
  showUpvote = true,
  showTracking = false,
  onOpenDetail,
  onToggleUpvote,
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const resolvedPhotoSrc = report?.photo_url
    ? report.photo_url.startsWith('/uploads')
      ? `${FASTAPI_BASE_URL}${report.photo_url}`
      : report.photo_url
    : null;

  useEffect(() => {
    setImgFailed(false);
  }, [resolvedPhotoSrc]);

  if (!report) return null;

  const statusText = STATUS_LABEL[report.status] || report.status;
  const catText = CATEGORY_LABEL[report.category] || report.category;
  const placeName = getPlaceName(report);
  const upvoteCount = Number(report.upvotes || 0);

  return (
    <article className="card overflow-hidden flex flex-col relative">
      {resolvedPhotoSrc && !imgFailed ? (
        <img
          src={resolvedPhotoSrc}
          alt={`Foto laporan: ${report.title}`}
          width="640"
          height="360"
          onError={() => setImgFailed(true)}
          className="w-full h-24 sm:h-32 object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-full h-24 sm:h-32 flex flex-col items-center justify-center px-3 sm:px-4 text-center bg-ink-100 dark:bg-ink-800/80 text-ink-700 dark:text-ink-300 border-b border-ink-200 dark:border-ink-800">
          <span className="text-xs sm:text-sm font-bold">{catText}</span>
          <span className="text-[11px] sm:text-xs mt-0.5">Belum ada foto</span>
        </div>
      )}

      <div className="p-3 sm:p-4 flex-1 flex flex-col gap-2 sm:gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className={getStatusBadgeClass(report.status)}>{statusText}</span>
          <span className={getCategoryBadgeClass(report.category)}>{catText}</span>
        </div>

        <div>
          <h3 className="text-sm sm:text-base font-bold text-ink-900 dark:text-white leading-snug">
            <button
              type="button"
              data-action="open-detail"
              data-id={report.id}
              data-show-upvote={String(showUpvote)}
              onClick={(e) => onOpenDetail?.(report.id, e.currentTarget, showUpvote)}
              aria-label={`Lihat detail laporan ${report.title}`}
              className="text-left hover:underline cursor-pointer after:absolute after:inset-0 after:content-['']"
            >
              {report.title}
            </button>
          </h3>
        </div>

        <p className="flex items-start gap-1.5 text-xs sm:text-sm font-semibold text-ink-900 dark:text-white">
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mt-0.5 text-brand-700 dark:text-brand-400"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
          </svg>
          <span className="min-w-0">{placeName}</span>
        </p>

        <div className="mt-auto flex flex-col gap-2 sm:gap-3 relative z-10">
          {showTracking && <AdminTrackingBox report={report} />}

          <p className="border-t border-ink-200 dark:border-ink-800 pt-2 sm:pt-3 text-xs sm:text-sm font-semibold text-ink-900 dark:text-white">
            {upvoteCount} dukungan
          </p>

          {showUpvote && (
            <button
              type="button"
              data-action="upvote"
              data-id={report.id}
              aria-pressed={isUpvoted}
              aria-label={`${isUpvoted ? 'Batalkan dukungan' : 'Dukung'} laporan ${report.title}, ${upvoteCount} dukungan`}
              onClick={(e) => onToggleUpvote?.(report.id, e.currentTarget)}
              className={`btn btn-sm sm:min-h-[44px] w-full px-2.5 sm:px-4 text-xs sm:text-sm cursor-pointer ${isUpvoted ? 'btn-primary' : 'btn-ghost'}`}
            >
              {isUpvoted ? 'Batalkan dukungan' : 'Dukung laporan'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
