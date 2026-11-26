# Frontend Tech Stack & Architecture Guide (STACK.md) — ReportLoop

**Fase:** Tahap 1 (Modular Vanilla HTML/CSS/ES Modules) -> Tahap 2 (Migrasi 1:1 ke React + Vite + Leaflet)  
**Pemilik Modul:** M. Fadil Faiz (UI/UX Designer & Frontend Developer)  
**Tujuan Dokumen:** Menjamin struktur kode awal memakai Vanilla Web Standards agar mudah di-debug bersama Backend FastAPI (Ibrahim Movik), sekaligus siap dipindahkan ke React tanpa menulis ulang logika bisnis.

---

## 1. Strategi Dua Tahap (Vanilla-First -> React Migration)

1. **Tahap 1 — Modular Vanilla HTML5 + Tailwind CSS + ES2022 Modules (Semifinal Early Prototype):**
   * Tanpa *build step* rumit sehingga langsung bisa dijalankan via Live Server / HTTP lokal saat demo dan pengujian endpoint FastAPI (`http://127.0.0.1:8000`).
   * Menggunakan ES Modules (`<script type="module">`) dengan pemisahan ketat antara **lapisan layanan (`services/`)**, **state terpusat (`state/`)**, **utilitas murni (`utils/`)**, dan **komponen tampilan (`features/` + `html/`)**.
2. **Tahap 2 — Migrasi ke React + Vite (Setelah Kontrak API 100% Teruji):**
   * Setiap folder dan berkas di struktur Vanilla memiliki pasangan langsung di struktur React sehingga proses konversi bersifat mekanis dan minim risiko bug.

---

## 2. Daftar Pustaka & Dependensi Eksternal

| Teknologi / Pustaka | Versi / Sumber | Fungsi & Alasan Pemilihan |
| :--- | :--- | :--- |
| **HTML5 Semantik** | Standar W3C | Struktur dokumen multi-halaman (`index.html` di root serta `html/user.html`, `html/admin.html`, `html/masuk.html`, `html/daftar.html`, `html/admin-masuk.html`, `html/admin-daftar.html`). |
| **Tailwind CSS + Custom CSS Tokens** | CDN + `css/base.css` | Utilitas tata letak responsif *mobile-first* dipadukan variabel CSS (`--bg-page`, `--brand`, `--border`) untuk dukungan *Light/Dark Mode* instan tanpa *flicker*. |
| **Vanilla JS (ES Modules)** | ES2022 Native | Pengelolaan state, validasi form, perhitungan jarak Haversine, klasifikasi NLP lokal, dan integrasi `fetch` API. |
| **Leaflet.js** | `1.9.4` (unpkg CDN) | Peta interaktif ringan untuk menampilkan polygon batas kampus Polindra, pin laporan berstatus, dan *draggable marker* lokasi laporan baru. |
| **Heroicons (Inline SVG)** | v2 Outline/Solid (24x24) | Ikon fungsional terstandar (peta, kamera, filter, dukungan/upvote, mode terang/gelap) tanpa menambah beban font ikon eksternal. |
| **IntersectionObserver API** | Browser Native | Animasi kemunculan elemen saat gulir (`js/utils/scrollReveal.js`) yang menghormati `prefers-reduced-motion`. |
| **Plus Jakarta Sans & JetBrains Mono** | Google Fonts | Tipografi utama antarmuka dan font monospace khusus koordinat/ID laporan. |

---

## 3. Struktur Direktori & Peta Konversi ke React

```text
frontend/
├── index.html                  # Landing & Papan Publik Read-Only (Hero + Alur + Live Board)
├── html/user.html              # Ruang Kerja Mahasiswa (Peta + Form Laporan + Papan Upvote)
├── html/admin.html             # Panel Triase Admin Sarpras (KPI + Antrean Prioritas + Peta)
├── html/masuk.html, html/daftar.html # Autentikasi Mahasiswa (NIM + Email Google, Google OAuth, Lupa Sandi, Ingat Saya 7 hari)
├── html/admin-masuk.html, html/admin-daftar.html # Autentikasi Petugas Sarpras terisolasi (Email Google + Kode Undangan, Google OAuth, Lupa Sandi, Ingat Saya 7 hari; siap untuk subdomain khusus di produksi)
├── PRD.md                      # Spesifikasi Kebutuhan Produk Frontend
├── DESIGN.md                   # Sistem Desain Blue-White Light/Dark Mode
├── STACK.md                    # Dokumentasi Arsitektur & Kontrak Teknis
â”œâ”€â”€ README.md                   # Cara menjalankan, akun demo, & konfigurasi Google OAuth
â”œâ”€â”€ CHECKLIST.md                # Checklist audit & roadmap pengerjaan
â”œâ”€â”€ MIGRATION-REACT.md          # Rencana migrasi ke React + Vite & daftar endpoint
â”œâ”€â”€ BACKEND-GOOGLE-AUTH.md      # Panduan backend untuk Google Auth (FastAPI)
├── css/
│   ├── base.css                # Token warna Light/Dark, komponen tombol/form/badge, utilitas
│   └── map.css                 # Dimensi kontainer Leaflet, pin target, & penyesuaian Dark Mode
├── html/                       # Partial HTML (setara komponen JSX di React)
│   ├── header.html             # -> <Header/> (Navigasi peran, toggle tema, mode API, sesi)
│   ├── footer.html             # -> <Footer/>
│   ├── view-mahasiswa.html     # -> <StudentDashboard/>
│   ├── view-admin.html         # -> <AdminDashboard/>
│   └── duplicate-modal.html    # -> <DuplicateReportModal/>
└── js/
    ├── main.js                 # -> App.jsx / main.jsx (Bootstrap halaman & event delegation)
    ├── config/
    │   ├── constants.js        # -> src/config/constants.js (Koordinat kampus, daftar tempat kampus, URL API, aturan NLP)
    │   └── tailwind.config.js  # -> tailwind.config.js
    ├── data/
    │   └── seedReports.js      # -> src/data/seedReports.js (Data awal Mode Demo)
    ├── state/
    │   └── store.js            # -> src/context/ReportContext.jsx / Zustand store
    ├── services/               # Logika murni tanpa akses DOM (100% reusable di React)
    │   ├── api.js              # -> src/services/api.js (Client REST FastAPI + Auth Header)
    │   ├── auth.js             # -> src/services/auth.js (Sesi 8j/7h, Google OAuth via POST /api/auth/google, reset sandi, foto profil per akun, & validasi peran)
    │   ├── geo.js              # -> src/utils/geo.js (Rumus Haversine radius 15m)
    â”‚   â”œâ”€â”€ places.js           # -> src/lib/places.js (Nama tempat laporan: place_name, atau titik kampus terdekat radius 80 m)
    │   └── nlp.js              # -> src/utils/nlp.js (Simulasi prediksi kategori TF-IDF/NB)
    ├── features/               # Kontroler UI per modul (setara komponen pintar React)
    │   ├── header.js           # Navigasi aktif, panel akun (sheet HP / dropdown desktop), foto profil di avatar, toggle Light/Dark Mode, toggle Demo/Live API
    │   ├── map.js              # Inisialisasi Leaflet, GPS Geolocation, & sinkronisasi marker
    │   ├── photo.js            # Dua opsi unggah foto bukti (ambil foto kamera & pilih file foto), validasi tipe/ukuran maks 5 MB, & cek umur foto (<= 24 jam)
    │   ├── reportForm.js       # Submit laporan (blokir foto lama), deteksi duplikat 15m, upvote, & update status
    │   ├── publicBoard.js      # Kartu ringkasan status sebagai filter, filter kategori, pencarian, tracking progres admin, & kartu laporan ringkas (foto, status, judul, nama tempat, dukungan; judul kartu membuka dialog detail)
    │   ├── adminPanel.js       # Hitung KPI riil & render antrean triase Sarpras
    │   ├── duplicateModal.js   # Kontrol dialog aksesibel (Escape & Tab focus trap)
    â”‚   â”œâ”€â”€ myReports.js        # Halaman Laporan Saya: tab Laporan saya (kartu ringkasan & chip status sebagai filter, pencarian, urutan), Pembaruan (garis waktu status_history), Didukung; render hanya saat halaman terbuka
    â”‚   â”œâ”€â”€ avatarCropper.js    # Dialog pangkas foto profil (geser, zoom, keyboard) -> JPEG 256x256
    â”‚   â”œâ”€â”€ reportDetail.js     # Dialog detail laporan (<dialog> native, animasi muncul 350ms): deskripsi lengkap, nama tempat, meter dukungan, progres & riwayat status, aksi Dukung dan Lihat di Peta
    â”‚   â”œâ”€â”€ stepsCarousel.js    # Carousel kartu 3 langkah (geser sentuh, seret mouse, titik indikator)
    │   └── authPage.js         # Validasi form login/register, Google OAuth, modal lupa sandi, & Ingat Saya
    └── utils/
        ├── badges.js           # Pemetaan label & kelas warna status/kategori
        ├── escapeHtml.js       # Sanitasi string untuk mencegah XSS pada innerHTML
        ├── scrollReveal.js     # Efek kemunculan halus berbasis IntersectionObserver
        ├── theme.js            # Pengelola tema Light/Dark + efek transisi radial dari tombol toggle (localStorage + prefers-color-scheme)
        └── toast.js            # Notifikasi umpan balik aksi pengguna
```

---

## 4. Arsitektur Data & Sinkronisasi Backend (FastAPI)

### 4.1 Penanganan Mode Ganda (`Demo Mode` vs `Live FastAPI`)
* Aplikasi berjalan default dalam **Mode Demo Interaktif** menggunakan `SEED_REPORTS` agar penguji dapat mencoba seluruh alur (buat laporan, uji foto lama, uji duplikat 15 meter, upvote, dan triase admin) meskipun backend lokal belum menyala.
* Tombol **Mode Data** di header melakukan pengecekan `GET /api/reports` dengan batas waktu `2500ms`. Jika server FastAPI aktif, state langsung beralih ke mode sinkronisasi penuh dengan PostgreSQL + PostGIS.

### 4.2 Kesiapan Token Autentikasi & Endpoint
* `js/services/api.js` menyediakan pembungkus `buildAuthHeaders()` yang otomatis menyertakan `Authorization: Bearer <token>` apabila sesi memiliki token JWT dari backend. Token sesi Google didapat dari `POST /api/auth/google` (kontrak lengkap di `BACKEND-GOOGLE-AUTH.md`).
* Seluruh panggilan jaringan menangani status HTTP standar FastAPI: `200 OK`, `201 Created`, `400 Bad Request` (`STALE_PHOTO_REJECTED`), dan `409 Conflict` (`DUPLICATE_NEARBY_REPORT`).

---

### 4.3 Foto Profil & Nama Tempat
* **Foto profil:** Disimpan per akun di `localStorage` (`reportloop.avatar.<peran>.<id>`) sebagai data URL JPEG 256x256 hasil pangkas, terpisah dari sesi agar sesi tidak membengkak. Ini hanya berlaku di mode demo. Unggah ke server menunggu kontrak backend (Step 6.1 `CHECKLIST.md`). Di React, `getProfilePhoto` dan `setProfilePhoto` menjadi hook `useProfilePhoto()`.
* **Nama tempat:** `services/places.js` memberi nama tempat dengan urutan `place_name` dari server, lalu titik kampus terdekat dari `CAMPUS_PLACES` (radius `PLACE_MATCH_RADIUS_METERS` = 80 m), lalu "Area kampus". Laporan baru menyimpan `place_name`. Field ini opsional di kontrak `Report` dan masih perlu disepakati dengan backend.

---

## 5. Checklist Kesiapan Sebelum Konversi ke React

- [ ] Seluruh alur pengguna (Pengunjung -> Masuk -> Buat Laporan + Peta + Foto -> Upvote -> Triase Admin) berjalan tanpa error di konsol browser.
- [ ] Mode Terang (Biru–Putih) dan Mode Gelap (Biru–Slate) teruji kontras dan keterbacaannya di seluruh halaman.
- [ ] Kontrak JSON `Report` dan endpoint `/api/reports` sudah teruji langsung dengan server FastAPI milik Ibrahim.
- [ ] Setelah 3 poin di atas terpenuhi, salin folder `js/services/`, `js/config/`, `js/data/`, dan `js/utils/` ke `src/` proyek React + Vite dan konversi `html/*.html` menjadi komponen `.jsx`.
