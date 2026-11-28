import { STATUS_LABEL } from '../lib/badges.js';

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

export function AdminTrackingBox({ report }) {
  if (!report) return null;

  const activeIdx = stepIndexForStatus(report.status);
  const history = Array.isArray(report.status_history) ? report.status_history : [];
  const latest = history.length > 0 ? history[history.length - 1] : null;
  const latestToLabel = latest ? STATUS_LABEL[latest.to] || latest.to : '';
  const latestWhen = latest ? formatTrackDate(latest.at) : '';

  return (
    <div className="track-box" aria-label="Progres pengerjaan admin">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-ink-900 dark:text-white">Progres admin</span>
        <span className="text-xs font-semibold text-ink-600 dark:text-ink-300">
          {STATUS_LABEL[report.status] || report.status}
        </span>
      </div>

      <div className="track-steps">
        {TRACK_STEPS.map((step, idx) => {
          const cls =
            idx < activeIdx
              ? 'track-step is-done'
              : idx === activeIdx
                ? 'track-step is-current'
                : 'track-step';
          return (
            <div key={step.key} className={cls}>
              <div className="track-bar" aria-hidden="true" />
              <span className="track-label">{step.label}</span>
            </div>
          );
        })}
      </div>

      {latest && (
        <p className="mt-2 border-t border-ink-200 dark:border-ink-800 pt-2 text-xs text-ink-600 dark:text-ink-300">
          Status ke <strong>{latestToLabel}</strong> oleh Admin
          {latestWhen ? ` (${latestWhen})` : ''}
        </p>
      )}
    </div>
  );
}
