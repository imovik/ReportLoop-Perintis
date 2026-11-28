# Checklist Audit & Step Pengerjaan Frontend React - ReportLoop

**Target:** Semifinal STACK 2026 (Deadline: 30 November 2026) -> Final Day (16 Desember 2026)  
**Arsitektur:** React 19 + Vite 6 + React Router v7 + Zustand + Tailwind CSS v4 + Leaflet (`frontend-react/`)

---

## Bagian 0: Migrasi & Fitur Inti yang Sudah Selesai

- [x] **Fondasi & Konversi 1:1 ke React + Vite (`frontend-react/`):** Menyiapkan proyek React SPA dengan `BrowserRouter` (`src/App.jsx`), store terpusat Zustand (`src/store/useAppStore.js`), dan bundel produksi Vite (`npm run build` lolos tanpa error).
- [x] **Autentikasi Peran, Google OAuth, Lupa Kata Sandi & Ingat Saya (7 Hari):** Halaman `/masuk`, `/daftar`, `/lupa-password`, `/admin-masuk`, dan `/admin-daftar` dengan isolasi portal Admin Sarpras, SDK Google Identity Services (`src/services/auth.js`), serta sesi 8 jam / 7 hari.
- [x] **Sistem Warna Light (Soft-White) & Dark Mode (`src/styles/base.css`, `ThemeToggle.jsx`):** Token warna `--page`, `--surface`, `--brand`, `--ink`, dan `--line` lengkap dengan skrip anti-*flicker* di `index.html` serta animasi transisi radial View Transitions API.
- [x] **Peta Interaktif Kampus & Geolocation (`src/components/CampusMap.jsx`):** Geofencing Politeknik Negeri Indramayu, *draggable marker*, preset gedung kampus, GPS Geolocation (`navigator.geolocation`), serta fokus kamera otomatis (`focusMapOn`).
- [x] **Form Pelaporan, Foto Bukti Maks. 24 Jam & Duplikat 15m (`ReportForm.jsx`, `DuplicateModal.jsx`):** Pratinjau kategori NLP otomatis (*Infrastructure*, *Cleanliness*, *Security*), dua opsi input foto bukti (kamera langsung & pilih file JPG/PNG/WebP maks. 5 MB), pemblokiran foto lama (> 24 jam), dan deteksi duplikat radius 15 meter.
- [x] **Kartu Laporan Ringkas, Dialog Detail & Koordinat Interaktif (`ReportCard.jsx`, `ReportDetailDialog.jsx`):** Kartu seragam dengan nama tempat (`getPlaceName()`), dialog `<dialog>` native dengan rincian lengkap, komponen pelacakan 3 tahap (`AdminTrackingBox.jsx`), riwayat `status_history`, serta baris **Koordinat** klikable (`lat, lng`) yang langsung memfokuskan peta ke titik laporan.
- [x] **Halaman Laporan Saya & Profil (`MyReportsView.jsx`, `ProfilePanel.jsx`, `AvatarCropperDialog.jsx`):** Tiga tab (*Laporan saya*, *Pembaruan*, *Didukung*) dengan filter kartu ringkasan status, serta pemangkas foto profil 256x256 JPEG.
- [x] **Panel Triase Admin Sarpras (`AdminPortalPage.jsx`):** Kartu KPI riil, antrean laporan terurut berdasarkan dukungan terbanyak, filter kategori/status, pembaruan status bertahap (`Received` -> `In Progress` -> `Resolved`), dan tampilan peta kampus.
- [x] **Dokumentasi React:** Memindahkan dan menyelaraskan `README.md`, `STACK.md`, `DESIGN.md`, `PRD.md`, `BACKEND-GOOGLE-AUTH.md`, dan `CHECKLIST.md` ke direktori `frontend-react/`.

---

## Step 1: Verifikasi Browser & Responsivitas UI (320px - 1440px)

- [ ] **1.1 Pengujian Alur Mahasiswa (`/`, `/masuk`, `/daftar`, `/lupa-password`, `/user`):**
  - [ ] Uji navigasi tab `#lapor`, `#papan`, `#laporan-saya`, dan `#profil` di desktop maupun layar seluler `320px`.
  - [ ] Uji klik kartu laporan -> dialog detail -> klik koordinat untuk melompat ke titik peta kampus.
  - [ ] Uji unggah foto bukti baru, simulasi foto lama (> 24 jam), dan modal duplikat radius 15 meter.
  - [ ] Uji pemangkas foto profil (`AvatarCropperDialog.jsx`) dengan mouse, sentuh, dan keyboard.
- [ ] **1.2 Pengujian Alur Admin Sarpras (`/admin-masuk`, `/admin-daftar`, `/admin`):**
  - [ ] Uji filter kategori/status, perubahan status `Received` -> `In Progress` -> `Resolved`, dan tampilan peta `#peta`.
- [ ] **1.3 Pemeriksaan Tema & Aksesibilitas:**
  - [ ] Verifikasi Light Mode (*Soft-White*) dan Dark Mode (*Blue-Slate*), navigasi keyboard (`Tab`, `Enter`, `Escape`), serta `prefers-reduced-motion`.

---

## Step 2: Integrasi & Pengujian End-to-End dengan Backend FastAPI

- [ ] **2.1 Konfigurasi Environment (`frontend-react/.env` & `backend/.env`):**
  - [ ] Mengisi `VITE_API_BASE_URL=http://127.0.0.1:8000` dan `VITE_GOOGLE_CLIENT_ID` di `frontend-react/.env`.
  - [ ] Mendaftarkan origin `http://localhost:5173` dan `http://localhost:4173` di Google Cloud Console serta `CORS_ORIGINS` backend FastAPI.
- [ ] **2.2 Uji Coba Mode Live API (`http://127.0.0.1:8000`):**
  - [ ] Menguji `GET /api/reports` dan normalisasi data `normalizeReport()` di `src/services/api.js`.
  - [ ] Menguji `POST /api/reports` (`multipart/form-data`), `400 STALE_PHOTO_REJECTED`, dan `409 DUPLICATE_NEARBY_REPORT`.
  - [ ] Menguji `POST` / `DELETE /api/reports/{id}/upvote` dengan header `Authorization: Bearer <token>`.
  - [ ] Menguji `PATCH /api/reports/{id}/status` dengan token Admin dan verifikasi penolakan `403` untuk token Mahasiswa.
  - [ ] Menjalankan daftar uji `POST /api/auth/google` di bagian 7 `BACKEND-GOOGLE-AUTH.md`.

---

## Step 3: Aset Proposal Semifinal & Fitur Final Day

- [ ] **3.1 Aset Proposal Semifinal (Target: Sebelum 30 November 2026):**
  - [ ] Mengambil tangkapan layar UI resolusi tinggi (Mobile & Desktop, Mode Terang & Gelap) untuk proposal dan video demo 2 menit.
- [ ] **3.2 Fitur Wajib Disisakan untuk Final Day (16 Desember 2026):**
  - [ ] Notifikasi *real-time* kepada pelapor saat status laporan diperbarui Admin.
  - [ ] Ekspor rekapitulasi laporan bulanan ke format PDF / CSV.
  - [ ] Klasterisasi marker peta & kolom komentar tindak lanjut pada detail laporan.
