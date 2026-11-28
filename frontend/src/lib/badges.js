export const STATUS_LABEL = {
  Received: 'Diterima',
  'In Progress': 'Diperbaiki',
  Resolved: 'Selesai',
};

export const CATEGORY_LABEL = {
  Infrastructure: 'Infrastruktur',
  Cleanliness: 'Kebersihan',
  Security: 'Keamanan',
};

export function getCategoryBadgeClass() {
  return 'badge badge-cat';
}

export function getStatusBadgeClass(status) {
  if (status === 'Resolved') return 'badge badge-resolved';
  if (status === 'In Progress') return 'badge badge-progress';
  return 'badge badge-received';
}

export function getStatusPinColor(status) {
  if (status === 'Resolved') return '#15803d';
  if (status === 'In Progress') return '#1d4ed8';
  return '#b45309';
}
