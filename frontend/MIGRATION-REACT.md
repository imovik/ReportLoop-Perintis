# Rencana Migrasi React: ReportLoop Perintis

Dokumen ini adalah panduan kerja langkah demi langkah untuk memindahkan frontend dari Vanilla HTML/CSS/ES Modules ke React + Vite, dengan prioritas utama: integrasi mulus dengan backend FastAPI + PostGIS milik tim backend.

**Target waktu (dari CHECKLIST.md):** Semifinal STACK 2026, 30 November 2026. Final Day, 16 Desember 2026.

**Prinsip migrasi:**

1. Lapisan yang sudah bersih (services, utils, config, data, state) dipindah dulu, hampir tanpa ubah.
2. Lapisan DOM (features, main.js) dikonversi jadi komponen, bukan disalin.
3. Mode demo dihapus secara bertahap; backend menjadi satu-satunya sumber kebenaran.
4. Tiap step punya Definition of Done (DoD) yang bisa diverifikasi lewat build, klik, atau uji API.

**Hasil audit kesiapan:** struktur FE sekitar 75% siap. Lapisan integrasi BE (`services/api.js`, kontrak OAuth di `services/auth.js`, `data/seedReports.js`) sudah rapi dan hampir tinggal dipindah. Bagian yang menentukan kecepatan adalah konversi 12 file di `js/features/` yang imperatif dan penuh `document.getElementById`.

---

## Step 0: Kunci Kontrak API dengan Backend (Wajib Sebelum Coding)

Migrasi tanpa kontrak yang dikunci akan memaksa refactor dua kali. Selesaikan ini dulu, bersama tim backend.

- [ ] Satukan daftar endpoint dan field JSON `Report`. Patokan FE saat ini:

| Method | Path | Fungsi | Catatan FE |
|---|---|---|---|
| GET | `/api/reports` | Daftar laporan | FE toleran response array polos atau `{reports: []}` |
| POST | `/api/reports` | Buat laporan | `multipart/form-data`, field foto: `photo`, plus `force_submit` |
| POST | `/api/reports/{id}/upvote` | Upvote | | 
| DELETE | `/api/reports/{id}/upvote` | Batalkan upvote | | 
| PATCH | `/api/reports/{id}/status` | Ubah status admin | Body `{status}`, tolak non-admin dengan 403 |
| POST | `/api/auth/google` | Masuk/daftar Google | Body `{credential, role, nim, invite_code}`, error 422 `NIM_REQUIRED` / `INVITE_REQUIRED` |

- [ ] Status backend saat ini (`backend/main.py`): rute yang sudah ada `GET /`, `GET /api/reports`, `POST /api/reports`, `POST /api/reports/{id}/upvote`, dan `PATCH /api/reports/{id}/status`. Belum ada: `DELETE /api/reports/{id}/upvote` (sudah dipanggil FE lewat `deleteUpvote`) dan `POST /api/auth/google`. Penolakan `403` untuk non-admin pada rute status belum diperiksa.
- [ ] Pastikan field `Report` identik dengan skema PostGIS. Patokan FE: `id, title, description, photo_url, photo_verification, latitude, longitude, category, nlp_confidence, status, upvotes, created_at, user_id, reporter_name, status_history`, ditambah `place_name` (opsional, nama tempat kampus; bila kosong FE menurunkannya dari titik terdekat).
- [ ] Pastikan kode error `400 STALE_PHOTO_REJECTED` dan `409 DUPLICATE_NEARBY_REPORT` stabil. FE sudah punya modal duplikat radius 15 m; putuskan backend sebagai sumber kebenaran utama, modal FE hanya fallback mode demo.
- [ ] Sepakati endpoint auth non-Google (login/daftar/reset password) kalau mode demo mau dibuang sepenuhnya.
- [ ] Sepakati endpoint foto profil (unggah, ambil, hapus) dan field URL fotonya. Di mode demo foto hanya tersimpan di `localStorage` per akun, jadi tanpa endpoint ini foto tidak ikut berpindah perangkat.
- [ ] CORS di backend mengizinkan origin dev React (`http://localhost:5173`) dan origin produksi.

**DoD Step 0:** dokumen kontrak 1 halaman disepakati kedua pihak, contoh response JSON per endpoint tertempel di dokumen itu.

---

## Step 1: Bootstrap Proyek React (Fondasi)

1. Buat proyek Vite + React, misalnya di `frontend-react/` (taro di luar folder `frontend/` lama agar rollback mudah):

```bash
npm create vite@latest frontend-react -- --template react
```

2. Instal dependensi: `react-router-dom`, `zustand`, `leaflet` (bukan `react-leaflet` dulu; marker layer custom FE lebih gampang dikendalikan manual; impor `leaflet/dist/leaflet.css` di entry), `tailwindcss` + `@tailwindcss/vite` (atau PostCSS klasik).
3. Tailwind dipasang sebagai build step, bukan CDN. Salin isi `css/base.css` dan `css/map.css` sebagai basis token warna soft-white dan tema gelap.
4. Ganti mekanisme konfigurasi: `FASTAPI_BASE_URL` dan `GOOGLE_CLIENT_ID` jadi env var:

```js
// src/config/constants.js
export const FASTAPI_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
```

Hapus override `localStorage` setelah transisi selesai, atau pertahankan satu rilis untuk keperluan debug. Salin juga `_headers` ke `public/_headers` agar aturan header host tetap berlaku.

**DoD Step 1:** `npm run dev` menampilkan halaman kosong dengan tema soft-white dan toggle gelap yang berfungsi di kedua mode.

---

## Step 2: Pindah Lapisan Bersih 1:1 (Tanpa Ubah Logika)

File-file ini sudah bebas DOM atau hampir bebas DOM. Pindahkan apa adanya ke `frontend-react/src/`:

| Sumber | Tujuan | Ubahan |
|---|---|---|
| `js/services/api.js` | `src/services/api.js` | Hampir nol. Konstanta impor dari `src/config/constants.js` |
| `js/services/geo.js` | `src/lib/geo.js` | Nol |
| `js/services/nlp.js` | `src/lib/nlp.js` | Nol |
| `js/utils/escapeHtml.js` | `src/lib/escapeHtml.js` | Nol. Di React sebenarnya redundan, tapi dipakai saat render string mentah peta |
| `js/utils/toast.js` | `src/components/Toast.jsx` + hook | Konversi kecil: container jadi komponen, panggilan tetap imperatif via module-level ref |
| `js/data/seedReports.js` | `src/data/seedReports.js` | Nol, data fallback/demo |
| `js/state/store.js` | `src/store/useAppStore.js` (Zustand) | Petakan tiap properti `state` jadi slice; instance Leaflet tetap disimpan di ref Zustand non-reactive |

Untuk Zustand, satu store cukup:

```js
// src/store/useAppStore.js
import { create } from 'zustand';
import { cloneSeedReports } from '../data/seedReports.js';

export const useAppStore = create((set) => ({
  reports: cloneSeedReports(),
  upvotedIds: new Set(),
  isLiveApi: false,
  activeCategoryFilter: 'ALL',
  setReports: (reports) => set({ reports }),
  toggleUpvoted: (id) => set((s) => {
    const next = new Set(s.upvotedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    return { upvotedIds: next };
  }),
}));
```

`main.js` lama (boot, partial fetch, delegated events) **tidak dipindah**. Fungsinya digantikan router + layout di Step 3.

**DoD Step 2:** build lolos, dan data seed tampil di console/store devtools. Tidak ada file lama yang diimpor dari luar `src/`.

---

## Step 3: Router, Layout, dan Tema (Pengganti main.js + Partials)

`main.js` memuat `header.html`, `view-*.html`, `footer.html` lewat fetch. Di React semua ini jadi komponen:

- [ ] `src/App.jsx` dengan `react-router-dom`: rute `/` (landing), `/masuk`, `/daftar`, `/lupa-password`, `/user`, `/admin`, plus rute auth admin terpisah kalau isolasi portal dipertahankan.
- [ ] `src/components/Layout.jsx` (header + outlet + footer) sebagai pengganti partials. Proteksi peran via guard route yang meniru `requireRole()` dari `services/auth.js`: sesi tidak valid atau peran salah, dialihkan ke halaman masuk peran yang benar.
- [ ] `src/components/ThemeToggle.jsx` dari `js/utils/theme.js`, dengan skrip anti-flicker di `index.html` sebelum bundle dimuat (logika di `js/utils/theme.js` baris awal bisa dipindah ke inline script kecil).
- [ ] `src/hooks/useScrollReveal.js` dari `js/utils/scrollReveal.js`, hormati `prefers-reduced-motion`.

**DoD Step 3:** navigasi antar rute berfungsi penuh lewat keyboard, tema gelap/terang konsisten di semua rute tanpa flash, guard peran mengarahkan dengan benar (user ke `/user`, admin ke `/admin`, tamu ke `/masuk`).

---

## Step 4: Halaman Auth (Buang Mode Demo)

Ini step paling sensitif karena `services/auth.js` punya dua sumber kebenaran: demo localStorage (PBKDF2 di browser) dan live Google OAuth.

- [ ] Pertahankan hanya bagian live: `loginWithGoogleOAuth()` dipindah ke `src/services/auth.js` apa adanya, kontraknya sudah sesuai `BACKEND-GOOGLE-AUTH.md`.
- [ ] Hapus `registerAccount`, `loginAccount`, `resetAccountPassword`, `isValidInviteCode` (kode undangan divalidasi backend), hash PBKDF2, dan storage `reportloop.accounts.*`. Penggantinya endpoint BE hasil kesepakatan Step 0.
- [ ] Konversi `js/features/authPage.js` (terberat, sekitar 450 baris, sangat DOM-centric) jadi komponen:
  - `AuthForm.jsx`: validasi `validateRegistration()` dipindah apa adanya karena murni fungsi.
  - `GoogleButton.jsx`: render tombol Google Identity Services seperti di `authPage.js`, callback mengirim credential ke `loginWithGoogleOAuth()`.
  - `NimInviteModal.jsx`: modal lengkapi NIM / kode undangan saat backend mengembalikan `NIM_REQUIRED` / `INVITE_REQUIRED`.
  - `ForgotPasswordDialog.jsx`.
- [ ] Simpan sesi ke localStorage dengan skema sama seperti sekarang (`role, id, email, name, provider, rememberMe, at, expiresAt`, ditambah `token` dari backend) supaya `services/api.js` tetap bekerja tanpa ubah.

**DoD Step 4:** daftar dan masuk lewat Google berhasil terhadap backend asli, modal NIM muncul saat akun baru tanpa NIM, logout benar-benar menghapus sesi, dan tidak ada lagi kode yang membaca `reportloop.accounts.*`.

---

## Step 5: Halaman Mahasiswa (User View)

Urutan konversi dari termudah ke tersulit:

1. `publicBoard.js` -> `PublicBoard.jsx`: grid kartu, kartu ringkasan status yang menjadi filter, filter kategori, pencarian, sortir, dan nama tempat pada kartu lewat `getPlaceName`. Kartu dibuat ringkas (foto, status, kategori, judul, nama tempat, dukungan, tombol Dukung), jadi `ReportCard` cukup menerima `report` dan opsi `showUpvote` serta `showTracking`, tanpa `maxUpvotes`; meter dukungan dan deskripsi hanya dirender di `ReportDetailDialog.jsx`. Papan tidak lagi punya tab cakupan; laporan milik sendiri dan dukungan pindah ke halaman Laporan Saya. State dari Zustand, event handler inline ala React.
2. `reportForm.js` + `photo.js` -> `ReportForm.jsx`:
   - Validasi foto (tipe `image/jpeg|png|webp`, maks 5 MB) dipindah apa adanya.
   - Aturan foto live wajib dan blokir `isStalePhoto` tetap aktif, diselaraskan dengan penolakan backend `400 STALE_PHOTO_REJECTED`.
   - Pratinjau NLP memanggil `predictNlpCategory()` yang sudah dipindah di Step 2.
3. `map.js` -> `CampusMap.jsx` (komponen tersulit):
   - Leaflet diinisialisasi di `useEffect` dengan cleanup (`map.remove()`), instance disimpan di ref Zustand non-reactive, bukan state React biasa (recreate map tiap render = bocor memori).
   - Klik peta mengisi lat/lng form via callback, bukan menulis `input.value` langsung.
   - Tombol "Gunakan Lokasi GPS Saya" memanggil `navigator.geolocation`, dengan state loading/error terpisah (R-27: tiap UI berdata wajib punya empty/loading/error state).
4. `duplicateModal.js` -> `DuplicateModal.jsx`: logika fokus trap dan Escape dipertahankan; fokus dikembalikan ke elemen pemicu setelah tutup.
5. `profile.js` -> `ProfilePanel.jsx`: form nama/email memanggil endpoint BE (atau endpoint profil hasil Step 0), bukan menulis localStorage.
6. `myReports.js` -> `MyReportsPage.jsx`: tiga tab (*Laporan saya*, *Pembaruan*, *Didukung*) memakai pola tablist yang sama (panah kiri/kanan, `aria-selected`). Filter kepemilikan memakai `isUserReport` (`user_id`). Tab *Laporan saya* memakai state `statusFilter` bersama untuk kartu ringkasan dan chip status. Tab *Pembaruan* dibangun dari `status_history` nyata. Komponen pelacak progres hanya dipakai di dialog detail. Render dilewati saat halaman tersembunyi (di React cukup tidak me-mount halaman), dan fokus dipertahankan setelah aksi Dukung.
7. `avatarCropper.js` -> `AvatarCropperDialog.jsx`: pertahankan elemen `<dialog>` native (Escape dan focus trap bawaan), geser lewat pointer events dan panah keyboard, serta penggeser zoom berlabel. Hasil JPEG 256x256 dikirim ke endpoint foto profil hasil Step 0.
8. `services/places.js` -> `src/lib/places.js`: logika murni, dipindah tanpa ubahan bersama `CAMPUS_PLACES` di `constants.js`.
9. `reportDetail.js` -> `ReportDetailDialog.jsx`: pertahankan elemen `<dialog>` native (Escape dan focus trap bawaan). Judul kartu di `PublicBoard.jsx` dan `MyReportsPage.jsx` adalah tombol pemicu; buka lewat state `selectedReportId` (Zustand), bukan menulis DOM langsung, dan kembalikan fokus ke judul kartu saat dialog tutup. Komponen pelacak progres dan `getPlaceName` dipakai bersama dengan kartu. Persentase meter dukungan dihitung di dialog dari `max(upvotes)` seluruh laporan. Animasi muncul (opacity dan `translateY 14px`, 350ms) tetap di CSS dan mati lewat `prefers-reduced-motion`. Aksi Dukung dan Lihat di Peta di dalam dialog memakai handler yang sama dengan kartu, dan dialog menutup setelahnya.

**DoD Step 5:** alur lengkap berjalan end to end melawan backend asli: buat laporan dengan foto live -> muncul di papan -> upvote -> status berubah oleh admin -> indikator 3 tahap (`Diterima` -> `Diperbaiki` -> `Selesai`) dan riwayat `status_history` tampil.

---

## Step 6: Halaman Admin

- [ ] `adminPanel.js` -> `AdminDashboard.jsx`: kartu KPI (total, Received, In Progress, Resolved), antrean triase, filter kategori/status, pencarian, sortir (default upvotes).
- [ ] Aksi `set-status` memanggil `patchReportStatus()` dari `services/api.js` yang sudah dipindah, lalu invalidate/refetch daftar laporan.
- [ ] Isolasi portal tetap dijaga: rute `/admin` hanya bisa diakses sesi peran admin, tidak ada tautan publik ke halaman admin di mana pun.

**DoD Step 6:** admin dapat memfilter dan mengubah status laporan, perubahan langsung terlihat di tampilan mahasiswa setelah refresh, token non-admin ditolak backend dengan 403 dan FE menampilkan error state yang jelas.

---

## Step 7: Landing Page dan Fitur Tambahan

- [ ] `index.html` -> `LandingPage.jsx`: split-hero, alur 3 langkah, pratinjau `SEED_REPORTS`, tombol masuk mahasiswa. Hindari auto-redirect seperti versi lama.
- [ ] `stepsCarousel.js` -> komponen carousel sederhana dengan dot indikator.
- [ ] Indikator mode API (titik hijau/amber) dari `API_MODE_STYLES` jadi komponen kecil yang membaca `isLiveApi` dari store.
- [ ] Pindahkan penyederhanaan teks Clean UI yang sudah ada di HTML lama; jangan menambah seksi baru yang tidak ada di konten nyata produk.

**DoD Step 7:** Lighthouse build production jalan, tidak ada error console, seluruh CTA punya tujuan nyata, layout responsif tanpa overflow horizontal sampai lebar 360 px.

---

## Step 8: Uji End to End dan Serah Terima

Jalankan daftar uji dari CHECKLIST.md Step 6.2 melawan `http://127.0.0.1:8000`:

- [ ] Buat laporan dengan foto live asli (multipart).
- [ ] Kirim foto lama, pastikan ditolak `400 STALE_PHOTO_REJECTED`.
- [ ] Kirim laporan dalam radius 15 m dari laporan aktif, pastikan `409 DUPLICATE_NEARBY_REPORT` dan modal muncul.
- [ ] Upvote dan batalkan upvote.
- [ ] Alur status: `Received` -> `In Progress` -> `Resolved` dengan riwayat tersimpan.
- [ ] Google OAuth: akun baru tanpa NIM memunculkan modal, akun admin tanpa kode undangan ditolak `INVITE_REQUIRED`.

Lalu: hapus folder `frontend/` lama hanya setelah satu minggu stabil (atau arsipkan sebagai tag Git), perbarui `STACK.md` dan `CHECKLIST.md`, dan ambil tangkapan layar proposal sesuai Step 7.1 checklist.

**DoD Step 8:** semua uji di atas lulus, dokumentasi kontrak API final tersimpan di repo, README baru menjelaskan cara set env var.

---

## Peta File: Sumber ke Tujuan

| Vanilla (sekarang) | React (tujuan) | Usaha |
|---|---|---|
| `js/services/api.js` | `src/services/api.js` | Rendah |
| `js/services/auth.js` (bagian OAuth) | `src/services/auth.js` | Rendah |
| `js/services/auth.js` (bagian demo) | hapus, ganti endpoint BE | Tinggi, keputusan bersama backend |
| `js/services/geo.js`, `nlp.js` | `src/lib/` | Rendah |
| `js/config/constants.js` | `src/config/constants.js` + env | Rendah |
| `js/state/store.js` | `src/store/useAppStore.js` | Rendah |
| `js/utils/theme.js` | `ThemeToggle.jsx` + inline anti-flicker | Sedang |
| `js/utils/scrollReveal.js` | `useScrollReveal.js` | Sedang |
| `js/utils/toast.js` | `Toast.jsx` | Sedang |
| `js/main.js` | router + `Layout.jsx` + guards | Tinggi, tulis ulang |
| `js/features/publicBoard.js` | `PublicBoard.jsx` | Sedang-tinggi |
| `js/features/reportForm.js` + `photo.js` | `ReportForm.jsx` | Tinggi |
| `js/features/map.js` | `CampusMap.jsx` | Tinggi |
| `js/features/adminPanel.js` | `AdminDashboard.jsx` | Tinggi |
| `js/features/authPage.js` | `AuthForm.jsx`, `GoogleButton.jsx`, `NimInviteModal.jsx` | Tinggi |
| `js/features/profile.js` | `ProfilePanel.jsx` | Sedang |
| `js/features/myReports.js` | `MyReportsPage.jsx` | Sedang |
| `js/features/avatarCropper.js` | `AvatarCropperDialog.jsx` | Sedang |
| `js/features/reportDetail.js` | `ReportDetailDialog.jsx` | Sedang |
| `js/services/places.js` | `src/lib/places.js` | Rendah |
| `js/features/duplicateModal.js` | `DuplicateModal.jsx` | Sedang |
| `js/features/header.js`, `stepsCarousel.js` | `Header.jsx`, `StepsCarousel.jsx` | Sedang |
| `css/base.css`, `css/map.css` | basis token Tailwind + CSS kustom peta | Rendah |
| `html/*.html` partials | komponen layout | Sedang |

## Risiko Utama dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Kontrak API berubah di tengah migrasi | Refactor ulang Step 4 sampai 6 | Step 0 wajib selesai dan ditandatangani kedua pihak |
| Dua sumber kebenaran (demo vs live) | Bug login dan data tidak sinkron | Buang mode demo di Step 4, jangan ditunda |
| Instance Leaflet bocor saat re-render | Memori bocor, peta macet | Map hidup di ref + cleanup `useEffect`, bukan state biasa |
| Fokus aksesibilitas hilang saat konversi modal | Regresi R-32 | Uji keyboard per komponen modal, terapkan focus trap seperti versi lama |
| Deadline semifinal terlalu dekat untuk full rewrite | Fitur setengah jadi | Tahap 1 (vanilla) tetap yang didaftarkan; React jadi Tahap 2 sesuai STACK.md, kecuali ada keputusan resmi memajukan jadwal |

## Estimasi Kasar

- Step 0 sampai 2: 2 sampai 3 hari kerja.
- Step 3 sampai 4: 2 sampai 3 hari.
- Step 5 sampai 6: 3 sampai 5 hari.
- Step 7 sampai 8: 2 sampai 3 hari plus uji E2E bersama backend.

Estimasi ini asumsi satu orang, belum termasuk waktu menunggu keputusan kontrak dari tim backend.