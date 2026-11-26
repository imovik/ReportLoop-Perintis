# Checklist Audit & Step Pengerjaan Frontend — ReportLoop

**Target:** Semifinal STACK 2026 (Deadline: 30 November 2026) -> Final Day (16 Desember 2026)  
**Arsitektur:** Tahap 1 Modular Vanilla HTML/CSS/ES Modules -> Tahap 2 React + Vite  

---

## Bagian 0: Sudah Selesai Direvisi

- [x] **Email Google, Google OAuth, Lupa Kata Sandi & Ingat Saya (7 Hari):** Menambahkan field email Google umum pada registrasi & profil mahasiswa, tombol *Masuk/Daftar dengan Google* (memakai Google Identity Services SDK resmi; token ID diverifikasi backend, tanpa akun dummy), dialog pemulihan kata sandi, serta checkbox *Ingat saya di perangkat ini* (memperpanjang sesi dari 8 jam menjadi 7 hari) pada `masuk.html`, `daftar.html`, `admin-masuk.html`, `admin-daftar.html`, `authPage.js`, `auth.js`, dan `profile.js`.
- [x] **Dokumen Spesifikasi & Desain:** Menyusun dan memperbarui `PRD.md`, `DESIGN.md`, dan `STACK.md` sesuai alur Semifinal vs. Final Day serta feedback terbaru (isolasi portal Sarpras, foto live wajib, profil khusus laporan user, palet *soft-white*, dan prinsip teks ringkas Clean UI).
- [x] **Token Warna Light & Dark Mode:** Menambahkan variabel warna dasar pada `css/base.css` serta penyesuaian peta gelap pada `css/map.css`.
- [x] **Pengelola Tema & Konfigurasi Tailwind:** Membuat `js/utils/theme.js` (Heroicons Matahari/Bulan + `localStorage`) dan `js/config/tailwind.config.js` (`darkMode: 'class'`).
- [x] **Efek Gulir Halus (*Scroll Reveal*):** Membuat `js/utils/scrollReveal.js` berbasis `IntersectionObserver` dengan dukungan `prefers-reduced-motion`.
- [x] **Header Aplikasi & Kesiapan Auth API:** Menambahkan tombol toggle tema pada `html/header.html`, memanggil `initTheme()` + `initScrollReveal()` di `js/main.js`, serta menambahkan dukungan `Authorization: Bearer <token>` di `js/services/api.js`.
- [x] **Aksesibilitas Target Sentuh:** Memastikan tombol `.btn-sm` dan filter `.chip` memiliki tinggi minimum `44px`.
- [x] **Penyederhanaan Teks (Clean UI):** Meringkas teks yang berulang dan menyatukan panduan singkat pada `index.html`, `html/view-mahasiswa.html`, `html/view-admin.html`, dan `html/footer.html`.

---

## Step Pengerjaan & Checklist yang Belum Dikerjakan (Urutan Eksekusi)

### Step 1: Penyesuaian Palet Warna *Soft-White* & Konsistensi Tema (Terang/Gelap)
- [x] **1.1 Pembaruan Token *Soft-White* (`css/base.css`):**
  - [x] Mengubah latar Light Mode ke *soft-white* (`--bg-page: #f1f5f9`, `--bg-surface: #f8fafc`, `--border: #cbd5e1`) agar tidak terlalu putih/menyilaukan bagi mahasiswa bermata minus maupun petugas Sarpras senior.
- [x] **1.2 Sinkronisasi Tema di Seluruh Entry HTML:**
  - [x] Memuat `js/config/tailwind.config.js` pada `user.html`, `admin.html`, `masuk.html`, `daftar.html`, `admin-masuk.html`, dan `admin-daftar.html`.
  - [x] Menambahkan skrip anti-*flicker* tema di `<head>` agar mode gelap/terang langsung aktif sebelum halaman dirender.
- [x] **1.3 Konsistensi Dark Mode pada Partial & Kartu Dinamis:**
  - [x] Memperbarui kelas warna dark mode di `html/view-mahasiswa.html` (kotak pratinjau NLP & banner foto lama).
  - [x] Memperbarui kelas warna dark mode di `html/view-admin.html` dan `js/features/adminPanel.js` (kartu KPI & baris antrean triase).
  - [x] Memperbarui kelas warna dark mode di `js/features/publicBoard.js` (kartu laporan publik) dan `html/duplicate-modal.html` (modal konfirmasi duplikat radius 15 m).

### Step 2: Isolasi Portal Login & UI Sarpras (Keamanan CIA)
- [x] **2.1 Pemisahan Tautan Publik & Portal Sarpras (`index.html`, `html/header.html`, `html/masuk.html`):**
  - [x] Menghapus seluruh tautan langsung ke `admin-masuk.html` / `admin-daftar.html` / `admin.html` dari `index.html`, `header.html`, dan halaman Mahasiswa agar akses Sarpras terisolasi (siap dipisah ke subdomain khusus di produksi).
  - [x] Memastikan `admin-masuk.html` dan `admin-daftar.html` berdiri sebagai UI terpisah dengan tombol pengalih tema (Terang/Gelap) dan proteksi guard peran pada `js/services/auth.js`.

### Step 3: Perbaikan Alur Foto Live & Pemblokiran Foto Lama (`photo.js`, `reportForm.js`, `view-mahasiswa.html`)
- [x] **3.1 Hapus Opsi Foto Lama di Form Buat Laporan Baru:**
  - [x] Menghilangkan pilihan/radio/tombol simulasi foto lama dari antarmuka `html/view-mahasiswa.html` sehingga form hanya menerima unggahan foto **live** (`capture="environment"`).
  - [x] Memastikan pada `js/features/photo.js` dan `js/features/reportForm.js`, apabila file foto terdeteksi sebagai foto lama (> 24 jam / `isStalePhoto`), tombol kirim diblokir dan laporan **tidak bisa dikirim**.
- [x] **3.2 Validasi File Foto Bukti (`js/features/photo.js`):**
  - [x] Menambahkan validasi tipe file gambar (`image/jpeg`, `image/png`, `image/webp`) dan batas ukuran maksimal `5 MB` dengan pesan umpan balik jelas.

### Step 4: Pemisahan Papan Laporan Profil (Khusus User) vs. Papan Laporan Umum
- [x] **4.1 Filter Khusus Laporan User di Profil (`js/features/profile.js`, `html/user.html`):**
  - [x] Memastikan saat membuka **Buka Papan Laporan** dari bagian **Profil**, daftar yang ditampilkan khusus berisi laporan milik user yang sedang login (difilter berdasarkan `user_id` / NIM pelapor).
  - [x] Memastikan laporan umum dari seluruh mahasiswa hanya tampil pada tab/halaman **Papan Laporan** utama (`js/features/publicBoard.js`).

### Step 5: Pembaruan Landing Page (`index.html`), Peta GPS, Tracking Progres Admin & Pembersihan File
- [x] **5.0 Pembaruan Dokumen `.md` untuk Fitur Tracking Admin:** Memperbarui `PRD.md`, `DESIGN.md`, dan `STACK.md` untuk mencatat alur pelacakan progres pengerjaan admin (`Diterima` -> `Diperbaiki` -> `Selesai`), riwayat status (`status_history`), dan aturan tampilan yang konsisten.
- [x] **5.0b Implementasi Fitur Tracking Pengerjaan Admin (User View):** Menambahkan indikator 3 tahap progres dan rincian riwayat status pada tampilan user (`publicBoard.js`, `profile.js`, dan `css/base.css`) sesuai panduan `DESIGN.md` dan `PRD.md`.
- [x] **5.1 Pembaruan Halaman Utama (`index.html`):**
  - [x] Mengganti *auto-redirect* langsung ke `masuk.html` menjadi halaman depan bergaya split-hero (`DESIGN.md`) dengan tombol masuk khusus Mahasiswa, alur 3 langkah berikon Heroicons, pratinjau papan laporan publik nyata (`SEED_REPORTS`), dan toggle Light/Dark Mode.
- [x] **5.2 Fitur Geolocation GPS Perangkat (`js/features/map.js` & `html/view-mahasiswa.html`):**
  - [x] Menambahkan tombol **"Gunakan Lokasi GPS Saya"** (`navigator.geolocation`) di atas/bawah peta kampus beserta penanganan error izin lokasi.
- [x] **5.3 Pembersihan File Lama:**
  - [x] Memindahkan atau menghapus file monolitik lama (`reportloop_campus_web_app.html` dan `reportloop_campus_web_app.backup.html`) jika masih ada setelah seluruh halaman modular terverifikasi.

### Step 5B: Revisi Navigasi, Foto Profil, Kartu Laporan & Halaman Laporan Saya (satu langkah per persetujuan)
- [x] **5B.A Menu Header (`html/header.html`, `js/features/header.js`):**
  - [x] Hamburger di HP, tombol avatar di desktop, panel akun (kartu identitas, Profil & Pengaturan Akun, Mode data, Keluar), dan tombol tema di header sudah ada.
  - [x] Menu Mahasiswa menjadi *Peta & Lapor*, *Papan Laporan*, *Laporan Saya* (`NAV_ITEMS` di `header.js`; desktop dan panel HP memakai daftar yang sama).
  - [ ] Verifikasi di browser dan cocokkan dengan gambar 1 (belum dijalankan; gambar belum bisa saya lihat).
- [x] **5B.B Foto Profil (`js/features/avatarCropper.js`, `js/features/profile.js`, `js/features/header.js`, `js/services/auth.js`):**
  - [x] Unggah, pangkas (geser, zoom, tombol panah), dan pratinjau foto di halaman Profil & Pengaturan; validasi JPG/PNG/WebP maks. 5 MB; hasil diperkecil ke 256x256 JPEG dan disimpan per akun di `localStorage` (`reportloop.avatar.<peran>.<id>`).
  - [x] Foto tampil di header, panel akun, dan kartu identitas Profil, dengan inisial sebagai cadangan; tombol *Ganti foto* dan *Hapus foto* tersedia.
  - [ ] Kontrak backend untuk unggah foto profil di mode live (endpoint dan field) belum ada; dicatat untuk Step 6.1. Saat ini foto hanya tersimpan di browser.
  - [ ] Verifikasi di browser (belum dijalankan): dialog pangkas (mouse, sentuh, keyboard, Escape), file salah tipe atau lebih dari 5 MB, hapus foto, dua tema, layar 320px.
- [x] **5B.C Kartu Laporan & Nama Tempat (`js/services/places.js`, `js/config/constants.js`, `js/features/publicBoard.js`, `js/features/profile.js`, `js/features/reportForm.js`):**
  - [x] Koordinat dihapus dari kartu papan dan diganti nama tempat; daftar di Profil menampilkan nama tempat; tombol *Lihat di Peta* tetap ada. Kartu admin memang tidak menampilkan koordinat.
  - [x] `place_name` disimpan pada laporan baru; laporan lama dan seed diturunkan dari titik kampus terdekat (radius 80 m, cadangan "Area kampus"). Field `place_name` (opsional) masih harus disepakati di kontrak `Report` Step 6.1.
  - [ ] Verifikasi di browser (belum dijalankan): kartu papan, Profil, laporan baru, dua tema, layar 320px.
- [x] **5B.D Papan Laporan Umum (`html/view-mahasiswa.html`, `js/features/publicBoard.js`):**
  - [x] Tab *Laporan saya* dan *Dukungan saya* dihapus dari papan; select status lama ikut dihapus karena digantikan kartu ringkasan.
  - [x] Kartu ringkasan status yang bisa diklik (Semua, Diterima, Diperbaiki, Selesai) sebagai filter, ditambah pencarian, chip kategori, dan grid kartu.
  - [ ] Verifikasi di browser dan cocokkan dengan gambar 2 (belum dijalankan).
- [x] **5B.E Halaman Laporan Saya (`js/features/myReports.js`, `html/view-mahasiswa.html`, `js/features/profile.js`, `js/main.js`):**
  - [x] Halaman sendiri dengan tiga tab: *Laporan saya*, *Progres saya*, dan *Didukung*; pelacakan dan daftar didukung dipindah dari Profil, dan tombol Profil kini membuka Laporan Saya.
  - [ ] Verifikasi di browser (belum dijalankan): tiga tab, keadaan kosong, batal dukungan, panah keyboard, dua tema, layar 320px.
- [ ] **5B.F Dokumen & Pemeriksaan:**
  - [x] Perbarui `DESIGN.md`, `PRD.md`, `STACK.md`, dan `MIGRATION-REACT.md` sesuai A sampai E (menu tiga item, panel akun, foto profil, Laporan Saya, nama tempat, kontrak `place_name`).
  - [x] Pemeriksaan antislop statis pada file baru dan yang diubah: tidak ada em dash di `js/`, `html/`, dan `index.html`. Catatan kecil R-39: kanvas pemangkas di `avatarCropper.js` memakai `role="img"` sekaligus `tabindex="0"`.
- [ ] Klik-through R-35 di dua tema dan breakpoint seluler (dijalankan di browser oleh Izzz).

### Step 5C: Ringkasan Aktivitas per User & Kartu Laporan Saya (satu langkah per persetujuan)
- [x] **5C.1 Ringkasan Aktivitas ke Laporan Saya (`js/features/myReports.js`, `html/view-mahasiswa.html`, `js/features/profile.js`):**
  - [x] Ringkasan dihitung dari laporan milik user saja (laporan saya, diterima, diperbaiki, selesai, dukungan diterima, laporan didukung) dan tampil di atas tab Laporan Saya.
  - [x] Ringkasan kampus dihapus dari Profil; Profil hanya memuat identitas dan pintasan. Sarpras tetap memakai ringkasan kerja di Antrean Triase (tidak ada yang dipindah).
- [x] **5C.2 Kartu Laporan Saya Disamakan dengan Kartu Papan (`js/features/publicBoard.js`, `js/features/myReports.js`):**
  - [x] `renderReportCard` diekspor dan dipakai ulang di Laporan Saya (foto dengan fallback ilustrasi, deskripsi, ID, tanggal, meter dukungan); kode kartu lama di `myReports.js` dihapus.
  - [x] Tombol Dukung disembunyikan di tab Laporan saya dan Progres saya; pelacakan hanya di Progres saya; tab Didukung tetap memiliki Batalkan dukungan.
  - [ ] Verifikasi di browser (belum dijalankan): foto dan fallback di tiga tab, batal dukungan memperbarui ringkasan, layar 320px.
- [ ] **5C.3 Dokumen & Pemeriksaan:** selaraskan `DESIGN.md` (7A), `PRD.md`, dan checklist; ulangi pemeriksaan antislop statis; verifikasi browser oleh Izzz.

### Step 5D: Konsistensi Kartu Laporan & Detail Laporan (satu langkah per persetujuan)
- [x] **5D.1 Bentuk Kartu Seragam (`js/features/publicBoard.js`, `css/base.css`):**
  - [x] Blok bawah kartu (jumlah dukungan dan tombol) didorong ke dasar kartu dengan `mt-auto`, sehingga sejajar di semua kartu dalam satu baris walau tinggi judul berbeda. Tinggi foto dan placeholder sama (`h-32`). Pelacak dan meter tidak lagi di kartu (lihat 5D.4).
  - [ ] Verifikasi di browser (belum dijalankan): kartu dengan dan tanpa blok progres dalam satu baris, dua tema, layar 320px.
- [x] **5D.2 Kartu Bisa Dibuka untuk Detail (`js/features/reportDetail.js`, `js/features/publicBoard.js`, `js/main.js`, `css/base.css`):**
  - [x] Judul kartu menjadi tombol asli (`data-action="open-detail"`) dengan area klik seluruh kartu; tombol Dukung dan Lihat di Peta tetap berfungsi di atasnya (`z-10`). Hover dan cincin fokus ada pada kartu.
  - [x] Dialog `<dialog>` native menampilkan foto, deskripsi lengkap, nama tempat (tanpa koordinat), waktu kirim, ID, jumlah dukungan, progres admin, dan riwayat status. Tutup lewat tombol Tutup, Escape, atau klik di luar panel. Berlaku di Papan Laporan dan tiga tab Laporan Saya.
  - [ ] Verifikasi di browser (belum dijalankan): klik kartu, Enter pada judul, Escape, Dukung dari dalam dialog, kartu tanpa riwayat status, dua tema, layar 320px.
- [x] **5D.4 Kartu Ringkas & Animasi Halus (`js/features/publicBoard.js`, `js/features/myReports.js`, `js/features/reportDetail.js`, `css/base.css`):**
  - [x] Kartu hanya memuat foto, status, kategori, judul, nama tempat, jumlah dukungan, dan tombol Dukung. Deskripsi, ID, tanggal, meter, dan tombol Lihat di Peta pindah ke dialog detail; pelacak 3 tahap di kartu hanya pada tab Progres saya. `renderReportCard(rep, options)` tidak lagi menerima `maxUpvotes`; `supportPercent` dihapus.
  - [x] Animasi dialog `350ms` (opacity dan `translateY 14px`), latar memudar, foto kartu `scale(1.03)` hanya pada `hover: hover` dan `pointer: fine`; mati lewat `prefers-reduced-motion`. Foto kartu `loading="lazy"` dan `decoding="async"`.
  - [ ] Verifikasi di browser (belum dijalankan): kartu ringkas di Papan dan tiga tab, animasi dialog dan hover, Dukung dari kartu, layar 320px, dua tema, reduced motion.
- [x] **5D.3 Dokumen:** `DESIGN.md` (7A), `PRD.md` (FR-05), `STACK.md` (struktur `features/`), dan `MIGRATION-REACT.md` (butir 9 dan tabel pemetaan) diselaraskan dengan 5D.1 dan 5D.2. Pemeriksaan statis: tidak ada em dash di `js/features/`, semua impor `reportDetail.js` dan `main.js` punya ekspor pasangannya.

### Step 5E: Evaluasi Halaman Laporan Saya (rencana, belum dikerjakan; satu langkah per persetujuan)
Temuan evaluasi (`js/features/myReports.js`, `html/view-mahasiswa.html`), semua dari pembacaan kode, belum diuji di browser:
- Tab *Laporan saya* dan *Progres saya* memakai data yang sama (`ownReports()`), bedanya hanya blok pelacak, yang kini juga ada di dialog detail.
- Enam kartu ringkasan terlalu banyak dan tidak bisa diklik; *Dukungan diterima* dan *Laporan didukung* tidak mengarah ke tindakan.
- Tidak ada pencarian, filter status, atau urutan, padahal Papan punya.
- `renderAll` memanggil `renderMyReports` walau halaman tersembunyi; tiap render menyaring daftar tiga kali dan membangun ulang semua kartu, dan fokus keyboard hilang setelah Dukung/Batalkan dukungan di tab Didukung.
- Keadaan kosong tab *Progres saya* sama dengan tab *Laporan saya*.

- [x] **5E.A Gabung Tab & Chip Status (`js/features/myReports.js`, `html/view-mahasiswa.html`):**
  - [x] Gabung *Laporan saya* dan *Progres saya* menjadi satu tab *Laporan saya* dengan chip status (Semua, Diterima, Diperbaiki, Selesai), pencarian, dan urutan; pelacak cukup di dialog detail. Pemeriksaan statis: semua id `myreports-*` ada di markup dan impor dari `publicBoard.js` punya ekspor pasangannya. Verifikasi browser belum dijalankan.
  - [x] Tab *Didukung* dipertahankan.
- [x] **5E.B Tab Pembaruan (`js/features/myReports.js`):**
  - [x] Garis waktu perubahan status pada laporan milik pengguna dari `status_history` nyata (laporan, status baru, waktu), terbaru di atas. Pemeriksaan statis: `node --check` lolos. Verifikasi browser belum dijalankan.
  - [x] Keadaan kosong jujur bila belum ada perubahan status; tidak ada riwayat karangan.
- [x] **5E.C Kartu Ringkasan Bisa Diklik:**
  - [x] Empat kartu (Semua, Diterima, Diperbaiki, Selesai) menjadi filter seperti di Papan, dengan `aria-pressed`. Pemeriksaan statis: `node --check` lolos. Verifikasi browser belum dijalankan.
  - [x] Kartu *Dukungan diterima* dan *Laporan didukung* dihapus.
- [ ] **5E.D Penanda Pembaruan Baru (opsional; `js/features/header.js`, `js/features/myReports.js`):**
  - [ ] Titik kecil pada menu Laporan Saya bila ada perubahan status yang belum dilihat; penanda terakhir dilihat di `localStorage`.
  - [ ] Di dokumen ditulis sebagai penanda lokal, bukan notifikasi real-time (notifikasi tetap Final Day di `PRD.md`).
- [x] **5E.E Efisiensi Render (`js/main.js`, `js/features/myReports.js`, `js/features/header.js`):**
  - [x] Render hanya saat halaman Laporan Saya terbuka (dilewati bila `#page-laporan-saya` tersembunyi, dan dirender ulang saat `switchView` membuka halaman itu); daftar disaring sekali per render. Pemeriksaan statis: `node --check` lolos pada `myReports.js` dan `header.js`. Verifikasi browser belum dijalankan.
  - [x] Fokus keyboard dipertahankan setelah Dukung/Batalkan dukungan (tombol dicari ulang berdasarkan `data-action` dan `data-id`; bila kartu hilang, fokus pindah ke panel).
- [x] **5E.F Dokumen & Pemeriksaan (sebagian):**
  - [x] `DESIGN.md` (Laporan Saya, kartu, dialog detail), `PRD.md` (FR-05), `STACK.md` (`myReports.js`), `MIGRATION-REACT.md` (butir 6), dan komentar di `view-mahasiswa.html` diselaraskan dengan 5E.A sampai 5E.E (tab Laporan saya, Pembaruan, Didukung; pelacak hanya di dialog detail).
  - [x] Pemeriksaan antislop statis: tidak ada em dash di `js/`, `html/`, dan `index.html`; tidak ada `indigo-`, `purple-`, `violet-`, atau `#6366f1` di kode.
  - [ ] Verifikasi browser (tab, filter, keadaan kosong, dua tema, 320px) oleh Izzz. Belum dijalankan.
  - [ ] Nama token di `DESIGN.md` bagian 2 (`--bg-subtle`, `--text-primary`, `--text-secondary`) belum disamakan dengan `base.css` (`--brand-soft`, `--ink`, `--ink-soft`).
  - [ ] Pemeriksaan emoji pada teks antarmuka belum dilakukan.
- Ditunda (butuh kontrak backend, Step 6.1): edit atau batalkan laporan sendiri selama berstatus *Diterima*, dan notifikasi push.

### Step 6: Integrasi & Pengujian End-to-End dengan Backend FastAPI
- [ ] **6.1 Kunci Kontrak API bersama Backend (Ibrahim Movik):**
  - [ ] Memastikan kesamaan path endpoint (`/api/reports`, `/api/reports/{id}/upvote`, `/api/reports/{id}/status`) dan field JSON `Report`.
  - [ ] Menyepakati field opsional `place_name` pada `Report` (nama tempat kampus; bila kosong FE menurunkannya dari titik terdekat).
  - [ ] Menyepakati endpoint foto profil (unggah, ambil, hapus) dan field URL fotonya. Saat ini foto hanya tersimpan di `localStorage` per akun.
  - [ ] Menambahkan rute yang belum ada di `backend/main.py`: `DELETE /api/reports/{id}/upvote` (sudah dipanggil FE) dan `POST /api/auth/google`.
- [ ] **6.2 Uji Coba Mode Live API (`http://127.0.0.1:8000`):**
  - [ ] Menguji pembuatan laporan baru dengan foto live asli (`multipart/form-data`).
  - [ ] Menguji penolakan foto lama (`HTTP 400 STALE_PHOTO_REJECTED`) agar tidak bisa dikirim.
  - [ ] Menguji deteksi laporan duplikat radius 15 meter (`HTTP 409 DUPLICATE_NEARBY_REPORT`).
  - [ ] Menguji fitur `+1 Upvote` dan pembaruan status Admin (`Received` -> `In Progress` -> `Resolved`).
- [ ] **6.3 Persiapan Backend Google OAuth (detail lengkap di `BACKEND-GOOGLE-AUTH.md`):**
  - [ ] Membuat OAuth Client ID (Web application) di Google Cloud Console dan mendaftarkan origin frontend; Client ID yang sama dipakai FE dan BE.
  - [ ] Mengimplementasikan `POST /api/auth/google`: verifikasi token ID ke Google, cek `email_verified`, cari atau buat akun, lalu kembalikan `{ id, email, name, token }`.
  - [ ] Mengembalikan kode error `NIM_REQUIRED` / `INVITE_REQUIRED` (status `422`) untuk akun baru agar modal lengkapi verifikasi di FE muncul.
  - [ ] Menyimpan `ADMIN_INVITE_CODE` dan `JWT_SECRET` di `.env` server, serta mengaktifkan CORS untuk origin frontend.
  - [ ] Memastikan `PATCH /api/reports/{id}/status` menolak token non-admin dengan `403`.
  - [ ] Mengisi `reportloop.apiBase` dan `reportloop.googleClientId` (atau nilai default di `constants.js` untuk production), lalu menjalankan daftar uji di bagian 7 `BACKEND-GOOGLE-AUTH.md`.

### Step 7: Aset Proposal Semifinal, Migrasi React & Fitur Final Day
- [ ] **7.1 Dokumentasi & Aset Proposal Semifinal (Target: Sebelum 30 November 2026):**
  - [ ] Mengambil tangkapan layar UI resolusi tinggi (tampilan Mobile & Desktop, Mode Terang Soft-White & Mode Gelap) untuk bab *Proposed Solution*.
  - [ ] Memastikan tidak ada fitur *Final Day* yang diklaim sudah selesai di proposal maupun video demo 2 menit.
- [ ] **7.2 Migrasi 1:1 ke React + Vite + Leaflet:**
  - [ ] Memindahkan `js/services/`, `js/config/`, `js/data/`, dan `js/utils/` ke `src/` proyek React.
  - [ ] Mengonversi `html/*.html` dan `js/features/*.js` menjadi komponen `.jsx` + *custom hooks*.
- [ ] **7.3 Fitur Wajib Disisakan untuk Final Day (16 Desember 2026):**
  - [ ] Notifikasi *real-time* kepada pelapor saat status laporan diperbarui Admin.
  - [ ] Ekspor rekapitulasi laporan bulanan ke format PDF / CSV.
  - [ ] Klasterisasi marker peta & kolom komentar tindak lanjut pada detail laporan.