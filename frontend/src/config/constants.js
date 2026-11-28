// ==========================================================================
// ReportLoop - Konstanta aplikasi (versi React)
// Dipindah dari frontend/js/config/constants.js. Perbedaan: alamat backend dan
// Google Client ID dibaca dari env var Vite. Override localStorage dipertahankan
// sebagai cadangan debug (tanpa build ulang).
// ==========================================================================

export const CAMPUS_CENTER = [-6.4085, 108.2815];

function readOverride(key) {
  try {
    return localStorage.getItem(key);
  } catch (_) {
    return null; // penyimpanan tidak tersedia
  }
}

// Urutan: override localStorage ('reportloop.apiBase'), env VITE_API_BASE_URL, lalu bawaan lokal.
function resolveApiBase() {
  const custom = readOverride('reportloop.apiBase');
  if (custom && /^https?:\/\//.test(custom)) return custom.replace(/\/+$/, '');
  return (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
}
export const FASTAPI_BASE_URL = resolveApiBase();
export const IS_LOCAL_HOST = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);

// Google OAuth 2.0 (Google Identity Services).
// Urutan: override localStorage ('reportloop.googleClientId'), env VITE_GOOGLE_CLIENT_ID.
function resolveGoogleClientId() {
  const custom = readOverride('reportloop.googleClientId');
  if (custom && custom.trim()) return custom.trim();
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
}
export const GOOGLE_CLIENT_ID = resolveGoogleClientId();

// Batas area geofencing kampus Politeknik Negeri Indramayu
export const CAMPUS_BOUNDARY = [
  [-6.4071, 108.2801],
  [-6.4071, 108.2842],
  [-6.4106, 108.2842],
  [-6.4106, 108.2801],
];

// Radius deteksi laporan duplikat (meter)
export const DUPLICATE_RADIUS_METERS = 15.0;

// Batas ukuran berkas foto profil setelah dipotong (200 KB)
export const MAX_AVATAR_BYTES = 200 * 1024;

// Tempat bernama di kampus. Sumber yang sama dengan titik cepat di form laporan.
export const CAMPUS_PLACES = [
  { id: 'koridor-lt2', name: 'Koridor Gedung Kuliah Lt. 2', short: 'Koridor Lt. 2', lat: -6.4085, lng: 108.2815 },
  { id: 'gerbang-utama', name: 'Gerbang Utama dan Parkiran', short: 'Gerbang utama', lat: -6.4091, lng: 108.2822 },
  { id: 'pagar-depan', name: 'Pagar Depan Kampus', short: 'Pagar depan', lat: -6.4079, lng: 108.2809 },
  { id: 'lab-baru', name: 'Gedung Bengkel dan Lab Baru', short: 'Gedung lab baru', lat: -6.4098, lng: 108.2834 },
];

// Titik laporan dianggap berada di sebuah tempat bila jaraknya tidak lebih dari ini (meter)
export const PLACE_MATCH_RADIUS_METERS = 80;
export const PLACE_FALLBACK_NAME = 'Area kampus';

// Aturan kata kunci untuk simulasi klasifikasi NLP
export const NLP_RULES = {
  Infrastructure: ['keran', 'lampu', 'bocor', 'ac', 'proyektor', 'pintu', 'kursi', 'listrik', 'pipa', 'banjir', 'patah', 'mati', 'padam', 'stopkontak', 'atap', 'kamar mandi'],
  Cleanliness: ['sampah', 'kotor', 'bau', 'toilet', 'genangan', 'saluran', 'limbah', 'meluap', 'jorok', 'bersih', 'tumpuk'],
  Security: ['gembok', 'pagar', 'gelap', 'gerbang', 'kunci', 'rawan', 'cctv', 'satpam', 'hilang', 'maling', 'terbuka'],
};

// Penanda mode data di header. Titik menandai status nyata (demo atau terhubung),
// tanpa kedip. Label teks selalu menyertai warna.
export const API_MODE_STYLES = {
  live: {
    dot: 'w-2.5 h-2.5 rounded-full bg-green-300',
    label: 'Terhubung ke FastAPI',
  },
  demo: {
    dot: 'w-2.5 h-2.5 rounded-full bg-amber-300',
    label: 'Mode demo',
  },
};
