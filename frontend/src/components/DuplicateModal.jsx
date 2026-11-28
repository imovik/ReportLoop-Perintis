import { useEffect, useRef } from 'react';
import { CATEGORY_LABEL } from '../lib/badges.js';

export function DuplicateModal({ prompt, onUpvoteExisting, onForceSubmit, onClose }) {
  const upvoteBtnRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!prompt) return;
    const prevFocus = document.activeElement;
    upvoteBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
    };
  }, [prompt, onClose]);

  if (!prompt) return null;

  const { existing, distance, candidate } = prompt;

  return (
    <div
      id="duplicate-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dup-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 fade-in"
    >
      <div
        ref={modalRef}
        className="card w-full max-w-md p-5 sm:p-6 space-y-4 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="badge badge-received">Deteksi Duplikat 15 m</span>
            <h2 id="dup-modal-title" className="mt-2 text-lg font-extrabold text-ink-900 dark:text-white">
              Laporan Serupa Sudah Ada
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="btn btn-sm btn-ghost"
            aria-label="Tutup dialog duplikat"
          >
            Tutup
          </button>
        </div>

        <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed">
          Laporan serupa sudah ada <strong>{distance} meter</strong> dari titik ini. Dukung laporan tersebut agar lebih cepat ditangani Sarpras.
        </p>

        <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-900/70 p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="badge badge-cat">
              {CATEGORY_LABEL[existing.category] || existing.category}
            </span>
            <span className="text-xs font-mono text-ink-600 dark:text-ink-300">
              Jarak {distance} m &bull; #{String(existing.id).slice(0, 8)}
            </span>
          </div>
          <p className="text-base font-bold text-ink-900 dark:text-white">
            {existing.title}
          </p>
          <p className="text-xs font-semibold text-brand-700 dark:text-brand-400">
            {existing.upvotes} dukungan saat ini
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            ref={upvoteBtnRef}
            type="button"
            onClick={() => onUpvoteExisting?.(existing.id)}
            className="btn btn-primary w-full"
          >
            Dukung Laporan yang Sudah Ada (+1 Upvote)
          </button>
          <button
            type="button"
            onClick={() => onForceSubmit?.(candidate)}
            className="btn btn-ghost w-full"
          >
            Tetap Kirim sebagai Laporan Terpisah
          </button>
        </div>
      </div>
    </div>
  );
}
