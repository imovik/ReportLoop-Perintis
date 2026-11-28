# Frontend Tech Stack & Architecture Guide (STACK.md) - ReportLoop

**Fase:** React + Vite SPA (Semifinal STACK 2026 & Integrasi FastAPI)  
**Pemilik Modul:** M. Fadil Faiz (UI/UX Designer & Frontend Developer)  
**Tim:** Tim Perintis - D4 Teknologi Rekayasa Komputer, Politeknik Negeri Indramayu  
**Kontrak Backend:** `http://127.0.0.1:8000` (FastAPI + PostgreSQL/PostGIS oleh Ibrahim Movik)

---

## 1. Ringkasan Arsitektur React + Vite

1. **Single-Page Application (SPA) Berbasis Komponen:**
   * Dibangun menggunakan **React 19** dan **Vite 6** dengan pemisahan ketat antara **lapisan layanan (`src/services/`)**, **state global terpusat (`src/store/useAppStore.js`)**, **utilitas murni (`src/lib/`)**, **custom hooks (`src/hooks/`)**, **komponen UI (`src/components/`)**, dan **halaman rute (`src/pages/`)**.
   * Menghilangkan manipulasi DOM manual dan menjaga perilaku 1:1 dengan spesifikasi produk ReportLoop.
2. **Kontrak API Terstandar (`normalizeReport`):**
   * Seluruh respons dari FastAPI maupun data awal Mode Demo dinormalisasi melalui `normalizeReport()` di `src/services/api.js` sehingga komponen UI menerima struktur data yang konsisten.

---

## 2. Daftar Pustaka & Dependensi Utama

| Teknologi / Pustaka | Versi | Fungsi & Alasan Pemilihan |
| :--- | :--- | :--- |
| **React & React DOM** | `^19.0.0` | Arsitektur komponen deklaratif untuk portal Mahasiswa, Admin Sarpras, dan autentikasi. |
| **Vite** | `^6.1.0` | *Dev server* cepat (`localhost:5173`), dukungan variabel environment `VITE_*`, dan bundel produksi teroptimasi. |
| **React Router DOM** | `^7.1.5` | Routing SPA client-side (`/`, `/user`, `/admin`, `/masuk`, `/daftar`, `/lupa-password`, `/admin-masuk`, `/admin-daftar`) serta guard peran di `Layout.jsx`. |
| **Zustand** | `^5.0.3` | State management ringan (`useAppStore.js`) untuk daftar laporan, mode Demo/Live API, status upvote, fokus kamera peta, dialog detail, dan antrean toast. |
| **Tailwind CSS (`@tailwindcss/vite`) + CSS Tokens** | `^4.0.9` | Utilitas tata letak responsif *mobile-first* dipadukan variabel CSS (`--page`, `--surface`, `--brand`, `--ink`, `--line`) pada `src/styles/base.css` untuk *Light/Dark Mode* instan. |
| **Leaflet.js** | `^1.9.4` | Peta interaktif kampus Polindra (`CampusMap.jsx`) dengan polygon batas area kampus, pin status laporan, *draggable marker*, dan pemfokusan kamera ke titik koordinat. |
| **Heroicons (Inline SVG)** | v2 Outline/Solid (24x24) | Ikon fungsional terstandar tanpa beban font ikon eksternal. |
| **Plus Jakarta Sans & JetBrains Mono** | Google Fonts | Tipografi utama antarmuka dan font monospace khusus koordinat/ID laporan. |

---

## 3. Struktur Direktori (`frontend-react/`)

```text
frontend-react/
â”œâ”€â”€ index.html                      # Shell HTML utama + skrip anti-flicker tema sebelum render
â”œâ”€â”€ package.json                    # Dependensi & skrip Vite (dev, build, preview)
â”œâ”€â”€ vite.config.js                  # Konfigurasi Vite + plugin React & Tailwind v4
â”œâ”€â”€ .env.example                    # Template VITE_API_BASE_URL & VITE_GOOGLE_CLIENT_ID
â”œâ”€â”€ PRD.md                          # Spesifikasi Kebutuhan Produk Frontend
â”œâ”€â”€ DESIGN.md                       # Sistem Desain Blue-White Light/Dark Mode
â”œâ”€â”€ STACK.md                        # Dokumentasi Arsitektur & Kontrak Teknis React
â”œâ”€â”€ README.md                       # Cara menjalankan, akun demo, & konfigurasi Google OAuth
â”œâ”€â”€ CHECKLIST.md                    # Checklist audit & pengujian E2E
â”œâ”€â”€ BACKEND-GOOGLE-AUTH.md          # Panduan backend untuk Google Auth (FastAPI)
â”œâ”€â”€ public/
â”‚   â”œâ”€â”€ _headers                    # Header keamanan & cache statis
â”‚   â””â”€â”€ assets/img/                 # Aset gambar statis aplikasi
â””â”€â”€ src/
    â”œâ”€â”€ main.jsx                    # Entry point React + BrowserRouter + load stylesheet
    â”œâ”€â”€ App.jsx                     # Definisi rute publik, user, admin, dan fallback redirect
    â”œâ”€â”€ config/
    â”‚   â””â”€â”€ constants.js            # Koordinat kampus, daftar tempat kampus, env VITE_*, aturan NLP
    â”œâ”€â”€ data/
    â”‚   â””â”€â”€ seedReports.js          # Data awal SEED_REPORTS untuk Mode Demo
    â”œâ”€â”€ store/
    â”‚   â””â”€â”€ useAppStore.js          # Zustand store terpusat (laporan, upvote, peta, dialog, toast)
    â”œâ”€â”€ services/
    â”‚   â”œâ”€â”€ api.js                  # Client REST FastAPI + Auth Bearer Header + normalizeReport()
    â”‚   â””â”€â”€ auth.js                 # Sesi 8j/7h, Google OAuth via POST /api/auth/google, reset sandi, avatar per akun, & validasi peran
    â”œâ”€â”€ lib/
    â”‚   â”œâ”€â”€ badges.js               # Pemetaan label & kelas warna status/kategori/pin peta
    â”‚   â”œâ”€â”€ escapeHtml.js           # Sanitasi string untuk popup HTML Leaflet
    â”‚   â”œâ”€â”€ geo.js                  # Rumus Haversine radius 15m & pengecekan poligon kampus
    â”‚   â”œâ”€â”€ nlp.js                  # Simulasi prediksi kategori TF-IDF/NB
    â”‚   â””â”€â”€ places.js               # Resolusi nama tempat laporan (place_name atau titik kampus radius 80m)
    â”œâ”€â”€ hooks/
    â”‚   â””â”€â”€ useScrollReveal.js      # Efek kemunculan halus berbasis IntersectionObserver
    â”œâ”€â”€ styles/
    â”‚   â”œâ”€â”€ index.css               # Entry CSS (Tailwind import + base.css + map.css)
    â”‚   â”œâ”€â”€ base.css                # Token warna Light/Dark, komponen tombol/form/badge, utilitas
    â”‚   â””â”€â”€ map.css                 # Dimensi kontainer Leaflet, pin target, & penyesuaian Dark Mode
    â”œâ”€â”€ components/
    â”‚   â”œâ”€â”€ Layout.jsx              # Pembungkus rute terproteksi (Auth guard + AppHeader + AppFooter + ToastContainer)
    â”‚   â”œâ”€â”€ AppHeader.jsx           # Navigasi peran, panel akun (sheet HP / dropdown desktop), avatar, toggle tema & mode API
    â”‚   â”œâ”€â”€ AppFooter.jsx           # Footer ringkas ReportLoop Polindra
    â”‚   â”œâ”€â”€ ThemeToggle.jsx         # Pengalih tema Light/Dark + animasi radial View Transitions API
    â”‚   â”œâ”€â”€ ToastContainer.jsx      # Antrean notifikasi umpan balik aksi pengguna
    â”‚   â”œâ”€â”€ CampusMap.jsx           # Komponen peta Leaflet interaktif + sinkronisasi pin & focusTarget
    â”‚   â”œâ”€â”€ ReportForm.jsx          # Form pelaporan baru + pratinjau NLP + kamera/file foto bukti maks 24 jam
    â”‚   â”œâ”€â”€ DuplicateModal.jsx      # Modal konfirmasi laporan serupa dalam radius 15 meter
    â”‚   â”œâ”€â”€ ReportCard.jsx          # Kartu laporan ringkas (foto, status, kategori, judul, nama tempat, dukungan)
    â”‚   â”œâ”€â”€ ReportDetailDialog.jsx  # Dialog detail laporan (<dialog> native): deskripsi, nama tempat, koordinat interaktif ke peta, dukungan, progres & riwayat status
    â”‚   â”œâ”€â”€ AdminTrackingBox.jsx    # Indikator 3 tahap progres pengerjaan admin (Diterima -> Diperbaiki -> Selesai)
    â”‚   â”œâ”€â”€ MyReportsView.jsx       # Halaman Laporan Saya: tab Laporan saya, Pembaruan (status_history), dan Didukung
    â”‚   â”œâ”€â”€ ProfilePanel.jsx        # Halaman Profil & pengaturan akun + pemicu pemangkas foto profil
    â”‚   â”œâ”€â”€ AvatarCropperDialog.jsx # Dialog pangkas foto profil (geser, zoom, keyboard) -> JPEG 256x256
    â”‚   â””â”€â”€ AuthShell.jsx           # Tata letak bersama halaman autentikasi Mahasiswa & Admin
    â””â”€â”€ pages/
        â”œâ”€â”€ LandingPage.jsx         # Beranda publik: Split Hero, tumpukan kartu 3 langkah, peran sistem, & papan publik
        â”œâ”€â”€ UserPortalPage.jsx      # Ruang kerja Mahasiswa (#lapor, #papan, #laporan-saya, #profil)
        â”œâ”€â”€ AdminPortalPage.jsx     # Panel triase Admin Sarpras (#antrean, #peta, #profil)
        â””â”€â”€ auth/
            â”œâ”€â”€ LoginPage.jsx       # Masuk Mahasiswa (NIM + Sandi atau Google OAuth)
            â”œâ”€â”€ RegisterPage.jsx    # Daftar Mahasiswa (NIM + Email Google + Sandi atau Google OAuth)
            â”œâ”€â”€ ResetPasswordPage.jsx # Pemulihan kata sandi Mahasiswa
            â”œâ”€â”€ AdminLoginPage.jsx  # Masuk Admin Sarpras terisolasi
            â””â”€â”€ AdminRegisterPage.jsx # Daftar Admin Sarpras dengan kode undangan
```

---

## 4. Arsitektur Data & Sinkronisasi Backend (FastAPI)

### 4.1 Penanganan Mode Ganda (`Demo Mode` vs `Live FastAPI`)
* Aplikasi berjalan default dalam **Mode Demo Interaktif** menggunakan `SEED_REPORTS` agar penguji dapat mencoba seluruh alur (buat laporan, uji foto lama, uji duplikat 15 meter, upvote, dan triase admin) meskipun backend lokal belum menyala.
* Tombol **Mode Data** pada panel akun di `AppHeader.jsx` memanggil `toggleApiMode()` di `useAppStore.js` untuk menguji `GET /api/reports` dengan batas waktu `3000ms`. Jika server FastAPI aktif, state otomatis beralih ke mode sinkronisasi penuh dengan PostgreSQL + PostGIS.

### 4.2 Kesiapan Token Autentikasi & Normalisasi Data
* `src/services/api.js` menyertakan `buildAuthHeaders()` yang otomatis melampirkan `Authorization: Bearer <token>` apabila sesi memiliki token JWT dari backend (`POST /api/auth/google`), serta `normalizeReport()` untuk menyelaraskan field `reporter_id` (`user_id`), `photo_url` relatif (`/uploads/...`), `place_name`, dan `status_history`.
* Seluruh panggilan jaringan menangani status HTTP standar FastAPI (`backend/main.py`): `200 OK`, `201 Created`, `400 Bad Request` (`STALE_PHOTO_REJECTED`), `403 Forbidden`, `409 Conflict` (`DUPLICATE_NEARBY_REPORT` / `ALREADY_UPVOTED`), dan `422 Unprocessable Entity` (`NIM_REQUIRED` / `INVITE_REQUIRED`).

### 4.3 Foto Profil & Nama Tempat
* **Foto profil:** Disimpan per akun di `localStorage` (`reportloop.avatar.<peran>.<id>`) sebagai data URL JPEG 256x256 hasil pangkas dari `AvatarCropperDialog.jsx`, terpisah dari sesi agar sesi tetap ringan. Unggah ke server menunggu kontrak endpoint backend pada tahap lanjutan.
* **Nama tempat:** `src/lib/places.js` (`getPlaceName`) menentukan nama tempat dengan urutan `place_name` dari server, lalu titik kampus terdekat dari `CAMPUS_PLACES` (radius `PLACE_MATCH_RADIUS_METERS` = 80 m), lalu cadangan `"Area kampus"`. Laporan baru menyimpan `place_name` secara otomatis.
