# Frontend ReportLoop (React + Vite)

Antarmuka web responsif untuk sistem pelaporan dan pemantauan kerusakan fasilitas kampus **Politeknik Negeri Indramayu (Polindra)**, dibangun dengan **React**, **Vite**, **Tailwind CSS**, **Zustand**, dan **Leaflet.js**. Dikembangkan oleh **Tim Perintis** (D4 Teknologi Rekayasa Komputer, Polindra).

---

## Prasyarat

- **Node.js** versi 18 atau lebih baru
- **npm** (bawaan Node.js)
- *(Opsional)* Backend FastAPI aktif di `http://127.0.0.1:8000` untuk mode Live API

---

## Cara Menjalankan (Lokal)

1. Masuk ke direktori `frontend-react` (sejajar dengan `backend` di repo tim) dan pasang dependensi:
   ```bash
   cd frontend-react
   npm install
   ```

2. *(Opsional)* Salin berkas environment jika ingin menghubungkan ke backend FastAPI atau Google OAuth:
   ```bash
   cp .env.example .env
   ```
   Isi variabel berikut di `.env`:
   ```env
   VITE_API_BASE_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)
   VITE_GOOGLE_CLIENT_ID=<CLIENT_ID>.apps.googleusercontent.com
   ```

3. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:5173` di browser.

4. Untuk membuat dan menguji build produksi:
   ```bash
   npm run build
   npm run preview
   ```

### Mode Data (`Demo` vs `Live FastAPI`)
- **Mode Demo (Default):** Menggunakan data awal `SEED_REPORTS` dan `localStorage` browser sehingga seluruh alur dapat diuji tanpa backend.
- **Mode Live API:** Hubungkan ke server FastAPI di `http://127.0.0.1:8000` melalui tombol **Mode Data** pada panel akun di header.

---

## Google OAuth (Client ID Asli, Diverifikasi Backend)

Tombol **Masuk/Daftar dengan Google** membaca `VITE_GOOGLE_CLIENT_ID` dari environment Vite (atau cadangan `localStorage.getItem('reportloop.googleClientId')` di `src/config/constants.js`). Tidak ada akun Google dummy.

- **Client ID kosong (default):** tombol menampilkan pesan bahwa Google belum dikonfigurasi.
- **Client ID terisi:** aplikasi memuat Google Identity Services resmi dan tombol Google asli tampil. Token ID dikirim ke `POST /api/auth/google` dan wajib diverifikasi backend. Panduan backend lengkap ada di `BACKEND-GOOGLE-AUTH.md`.

Cara menghubungkan Client ID asli: buat OAuth Client ID (tipe *Web application*) di Google Cloud Console, tambahkan alamat dev Vite (`http://localhost:5173`) ke *Authorized JavaScript origins*, lalu isi `VITE_GOOGLE_CLIENT_ID` di `.env` (atau jalankan `localStorage.setItem('reportloop.googleClientId', '<CLIENT_ID>.apps.googleusercontent.com')` di console browser tanpa build ulang).

---

## Akun & Cara Masuk (Mode Demo)

Akun demo disimpan secara lokal di `localStorage` browser masing-masing.

- **Mahasiswa (Pelapor)**
  1. Daftar di `/daftar` menggunakan **NIM (6â€“12 digit)**, **Email Google umum** (`@gmail.com`), dan kata sandi (min. 8 karakter), atau gunakan tombol **Daftar dengan Google** (OAuth).
  2. Masuk melalui `/masuk` (via NIM + sandi atau **Masuk dengan Google**), dengan opsi **Ingat saya di perangkat ini** (sesi 7 hari) dan **Lupa kata sandi?** (`/lupa-password`) untuk mengakses `/user`.
- **Admin Sarpras (Pengelola)**
  1. Daftar di `/admin-daftar` menggunakan **Email Google**, kata sandi (min. 8 karakter), dan kode undangan demo (diberikan terpisah oleh tim pengembang, tidak ditulis di repo), atau gunakan tombol **Daftar dengan Google** + kode undangan.
  2. Masuk melalui `/admin-masuk` (via email atau **Masuk dengan Google**), dilengkapi opsi **Ingat saya** (7 hari) untuk mengakses panel triase `/admin`.

---

## Struktur Direktori (`frontend-react/`)

```text
frontend-react/
â”œâ”€â”€ index.html                  # Shell HTML utama + skrip anti-flicker tema
â”œâ”€â”€ package.json                # Dependensi & skrip Vite (dev, build, preview)
â”œâ”€â”€ .env.example                # Template VITE_API_BASE_URL & VITE_GOOGLE_CLIENT_ID
â”œâ”€â”€ PRD.md                      # Spesifikasi kebutuhan produk frontend
â”œâ”€â”€ DESIGN.md                   # Panduan sistem desain Light/Dark Mode
â”œâ”€â”€ STACK.md                    # Arsitektur teknis React + Zustand + Leaflet
â”œâ”€â”€ BACKEND-GOOGLE-AUTH.md      # Panduan backend: kontrak & implementasi Google Auth
â”œâ”€â”€ CHECKLIST.md                # Checklist audit & pengujian E2E
â””â”€â”€ src/
    â”œâ”€â”€ main.jsx                # Entry point React & BrowserRouter
    â”œâ”€â”€ App.jsx                 # Definisi rute publik, mahasiswa, dan admin
    â”œâ”€â”€ config/                 # Konstanta kampus, endpoint API, & aturan NLP
    â”œâ”€â”€ data/                   # Data awal SEED_REPORTS untuk Mode Demo
    â”œâ”€â”€ store/                  # Store Zustand terpusat (useAppStore.js)
    â”œâ”€â”€ services/               # Client REST FastAPI (api.js) & autentikasi (auth.js)
    â”œâ”€â”€ lib/                    # Utilitas murni (geo 15m, places 80m, nlp, badges, escapeHtml)
    â”œâ”€â”€ hooks/                  # Custom hooks (useScrollReveal.js)
    â”œâ”€â”€ components/             # Komponen UI (peta, form, kartu, dialog detail, pemangkas avatar)
    â”œâ”€â”€ pages/                  # Halaman utama (LandingPage, UserPortalPage, AdminPortalPage, auth/*)
    â””â”€â”€ styles/                 # Token warna Light/Dark (base.css), peta (map.css), & entry CSS
```

---

## Status Fitur (Semifinal vs. Target Final Day)

**Sudah tersedia di build React (Semifinal):**
- Autentikasi terpisah Mahasiswa (NIM + Email Google) dan Admin Sarpras (Email Google + kode undangan), dilengkapi **Google OAuth**, **Lupa kata sandi**, dan opsi **Ingat saya (7 hari)**.
- Peta interaktif kampus Polindra (`CampusMap.jsx`) dengan *draggable marker*, preset titik kampus, GPS Geolocation, dan pin status.
- Form pelaporan (`ReportForm.jsx`) + pratinjau kategori NLP otomatis (*Infrastructure*, *Cleanliness*, *Security*).
- Validasi foto bukti terbaru (kamera langsung atau unggah file maks. 24 jam, JPG/PNG/WebP maks. 5 MB) dan deteksi laporan duplikat dalam radius 15 meter (`DuplicateModal.jsx`).
- Papan laporan publik, dialog detail laporan (`ReportDetailDialog.jsx`) dengan koordinat interaktif menuju titik peta, halaman **Laporan Saya** (`MyReportsView.jsx`), dan `+1 Dukungan`.
- Panel triase Admin Sarpras (`Received` -> `In Progress` -> `Resolved`) + Light/Dark Mode (*Soft-White* & *Blue-Slate*).

**Disiapkan untuk tahap selanjutnya (Final Day & Production):**
- Notifikasi *real-time* ke pelapor saat status berubah.
- Ekspor rekap laporan bulanan (PDF / CSV).
- Klasterisasi marker peta & kolom komentar tindak lanjut pada detail laporan.
