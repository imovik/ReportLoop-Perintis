# Design System & Visual Direction (DESIGN.md) - ReportLoop

**Produk:** ReportLoop - Pelaporan Fasilitas Kampus Politeknik Negeri Indramayu  
**Dial Desain:** `ENERGY 2 / RHYTHM 2 / MOTION 2`  
**Arsitektur UI:** React + Vite + Tailwind CSS (`frontend-react/`)  
**Referensi Struktur Visual:** Komposisi editorial modern dengan palet **Biru-Putih (Light Mode)** dan **Biru-Slate Gelap (Dark Mode)** yang bersih, terstruktur, dan bebas *AI slop*.

---

## 1. Identitas Visual & Struktur Halaman

Komposisi visual dirancang secara fungsional untuk kebutuhan **ReportLoop** tanpa elemen dekoratif yang tidak relevan:

1. **Split Hero dengan Pratinjau Produk Nyata (`src/pages/LandingPage.jsx`):**
   * **Sisi Kiri (Fokus Tipografi & Aksi):** Judul utama tegas dengan penekanan warna biru merek (`#1d4ed8` pada Light Mode / `#60a5fa` pada Dark Mode) pada frasa kunci (*"Dari Titik Lokasinya."*), deskripsi ringkas alur pelaporan, dan tombol aksi utama untuk masuk sebagai Mahasiswa (portal login Admin Sarpras `/admin-masuk` diisolasi dari UI publik demi keamanan CIA).
   * **Sisi Kanan (Pratinjau Antarmuka & Bidang Aksen Geometri):** Bingkai pratinjau aplikasi ReportLoop (ringkasan triase kampus + kartu status laporan) di atas bidang aksen biru solid melengkung (`rounded-2xl bg-brand-700`) agar mata langsung tertuju pada pratinjau produk.
2. **Ritme Section Bervariasi (`RHYTHM 2`):**
   * **Alur 3 Langkah Inti (Tumpukan Kartu Interaktif):** Tiga kartu bertumpuk (`WORKFLOW_STEPS` di `LandingPage.jsx`) dengan ikon Heroicons berbingkai tipis di atas label ringkas (*01 / LOKASI: Sematkan Titik Peta*, *02 / BUKTI & NLP: Klasifikasi Otomatis NLP*, *03 / PRIORITAS: Triase & Upvote Kolektif*). Kartu paling atas dapat digeser lewat sentuh layar atau seret mouse, disertai titik indikator tab dan navigasi panah kiri/kanan keyboard.
   * **Section Split Tentang Sistem & Alur:** Penjelasan peran ganda (Mahasiswa Pelapor & Unit Sarpras) dengan daftar poin berikon centang.
   * **Papan Laporan Publik Langsung (*Live Public Preview*):** Menampilkan kartu laporan nyata dari Zustand store (`reports`), lengkap dengan nama tempat dan tombol detail/dukungan.
   * **Banner Aksi Penutup (*Callout Card*):** Kartu biru solid berujung membulat (`rounded-2xl`) di bagian bawah untuk ajakan langsung masuk atau membuat laporan sebagai Mahasiswa.
3. **Kejujuran Data (Aturan Anti-Slop):**
   * Elemen statistik karangan tidak digunakan. Seluruh angka ringkasan dihitung langsung dari data laporan nyata (jumlah laporan diterima, diperbaiki, selesai, dan jumlah dukungan).

---

## 2. Sistem Warna: Light Mode & Dark Mode (Biru-Putih)

Palet dibatasi pada **2 warna inti (Putih/Slate netral + Biru Merek)** ditambah **3 warna status fungsional** yang hanya muncul pada badge status dan pin peta.

### 2.1 Token Warna Light Mode (`:root` / Default - Soft-White Anti-Silau)
Palet terang menggunakan *soft-white* untuk menjaga kenyamanan baca bagi mahasiswa bermata minus maupun petugas Sarpras senior. Seluruh token didefinisikan di `src/styles/base.css`:
* **Latar Utama (`--page`):** `#f1f5f9` (Soft-white abu-biru lembut, mengurangi silau layar).
* **Permukaan Kartu (`--surface`):** `#f8fafc` (Putih lembut dengan garis tepi `1px solid var(--line)`, bukan `#ffffff` murni yang menyilaukan; permukaan redup `--surface-muted`: `#e2e8f0`).
* **Permukaan Sekunder Merek (`--brand-soft`):** `#e8f0fe` (Biru lembut untuk sorotan info NLP & kartu ringkasan; garis tepi `--brand-line`: `#bfdbfe`).
* **Teks Utama (`--ink`):** `#0f172a` (Kontras > 13:1 terhadap latar soft-white).
* **Teks Sekunder (`--ink-soft`):** `#475569` (Kontras > 6:1 terhadap latar soft-white, lolos WCAG AA).
* **Warna Merek Utama (`--brand`):** `#1d4ed8` (Biru Cobalt tegas; hover `--brand-dark`: `#1e40af`).
* **Garis Pembatas (`--line`):** `#cbd5e1`.

### 2.2 Token Warna Dark Mode (`html.dark`)
* **Latar Utama (`--page`):** `#090e1a` (Biru malam sangat gelap, bukan hitam pekat agar nyaman di mata).
* **Permukaan Kartu (`--surface`):** `#111827` (Slate biru gelap dengan garis tepi `1px solid var(--line)`; permukaan redup `--surface-muted`: `#1e293b`).
* **Permukaan Sekunder Merek (`--brand-soft`):** `#172554` (Biru tua lembut untuk kotak prediksi NLP & sorotan aktif; garis tepi `--brand-line`: `#1e40af`).
* **Teks Utama (`--ink`):** `#f8fafc` (Putih bersih, kontras > 15:1).
* **Teks Sekunder (`--ink-soft`):** `#cbd5e1` (Abu-biru terang, kontras > 9:1).
* **Warna Merek Utama (`--brand`):** `#3b82f6` untuk tombol/sorotan latar & `#60a5fa` untuk teks tautan/aksen judul (kontras > 6:1 di latar gelap; hover `--brand-dark`: `#2563eb`).
* **Garis Pembatas (`--line`):** `#1e293b`.

### 2.3 Warna Status Fungsional (Konsisten di Kedua Tema)
| Status | Light Mode (Latar / Teks) | Dark Mode (Latar / Teks) | Pin Peta (`src/lib/badges.js`) |
| :--- | :--- | :--- | :--- |
| **Received (Diterima)** | `#fef3c7` / `#78350f` | `#451a03` / `#fcd34d` | `#b45309` |
| **In Progress (Diperbaiki)** | `#dbeafe` / `#1e3a8a` | `#1e3a8a` / `#93c5fd` | `#1d4ed8` |
| **Resolved (Selesai)** | `#dcfce7` / `#14532d` | `#052e16` / `#86efac` | `#15803d` |

### 2.4 Token Pendukung (Galat, Netral Tambahan, Teks di Atas Merek)
Didefinisikan di `src/styles/base.css` pada `:root` dan `html.dark`. Warna galat hanya muncul pada keadaan error (teks galat, field tidak valid, tombol hapus/bahaya), bukan sebagai aksen dekoratif.
| Token | Light Mode | Dark Mode | Fungsi |
| :--- | :--- | :--- | :--- |
| `--danger` | `#dc2626` | `#dc2626` | Garis field tidak valid, teks galat di mode terang |
| `--danger-ink` | `#991b1b` | `#fca5a5` | Teks tombol bahaya dan teks galat di mode gelap |
| `--danger-line` | `#fecaca` | `#7f1d1d` | Garis tepi tombol bahaya |
| `--danger-soft` | `#fef2f2` | `#450a0a` | Latar hover tombol bahaya |
| `--muted` | `#64748b` | `#94a3b8` | Teks placeholder input |
| `--line-strong` | `#94a3b8` | `#94a3b8` | Garis tepi input saat hover |
| `--on-brand` | `#ffffff` | `#ffffff` | Teks/ikon di atas bidang warna merek |

Catatan: `.badge-cat` memakai `#e8eef7` (terang) dan `#1e293b` (gelap) sebagai latar kategori netral, dan beberapa aturan header mode gelap memakai nilai tetap agar kontras teks putih tetap di atas 4,5:1.

---

## 3. Tipografi & Hierarki Skala

* **Font Utama (`--font-sans`):** `Plus Jakarta Sans` (dimuat di `index.html`) dipilih karena proporsi hurufnya jernih untuk kalimat Bahasa Indonesia dan antarmuka operasional kampus.
* **Font Monospace (`--font-mono`):** `JetBrains Mono` digunakan khusus pada angka koordinat GPS (`-6.40850, 108.28150`), ID laporan (`#rep-001`), dan persentase keyakinan NLP agar digit sejajar vertikal.
* **Skala Ukuran:**
  * Hero Headline (`h1`): `clamp(2rem, 4vw, 3rem)`, `font-weight: 800`, `line-height: 1.15`, `letter-spacing: -0.025em`.
  * Judul Section (`h2`): `1.375rem` sampai `1.75rem`, `font-weight: 800`, `letter-spacing: -0.015em`.
  * Judul Kartu (`h3`): `1rem` sampai `1.125rem`, `font-weight: 700`.
  * Teks Isi & Form: `0.9375rem` sampai `1rem` (`16px` pada input mobile untuk mencegah *auto-zoom* iOS).

---

## 4. Sistem Komponen, Radius & Elevasi

* **Hierarki Radius:**
  * Kartu utama & panel peta: `14px` (`0.875rem`).
  * Input form, tombol standar, & badge status: `8px` (`0.5rem`).
  * Filter chip kategori & indikator aktif: `9999px` (pill khusus kontrol filter).
* **Elevasi & Bayangan:**
  * Kartu di atas kanvas memakai garis tepi `1px solid var(--line)` tanpa bayangan tebal.
  * Bayangan lembut hanya dipakai pada elemen melayang: header sticky, pin koordinat di atas peta, dan dialog modal.
* **Standar Target Sentuh & Fokus:**
  * Seluruh tombol interaktif, chip filter, tab, dan tombol toggle tema memiliki tinggi minimal `44px` (`min-h-[44px]`).
  * Fokus keyboard memakai `outline: 2px solid var(--brand)` dengan `outline-offset: 2px`.

---

## 5. Pustaka Eksternal & Aset Fungsional

1. **Heroicons (Inline SVG 24x24, Stroke `1.75`):** Dipakai secara konsisten sebagai ikon fungsional (pin lokasi peta, kamera foto bukti, pencarian, filter, jempol dukungan/upvote, pengalih tema matahari/bulan, dan tanda centang status).
2. **Leaflet.js `1.9.4` (`src/components/CampusMap.jsx` + `src/styles/map.css`):**
   * Mode Terang menggunakan tile peta OpenStreetMap standar yang terang.
   * Mode Gelap menyesuaikan filter kontainer peta agar tidak menyilaukan mata pengguna.
3. **Scroll Reveal Hook (`src/hooks/useScrollReveal.js`):**
   * Menggunakan `IntersectionObserver` untuk memunculkan section dan kartu secara halus saat digulir (`opacity: 0 -> 1`, `translateY: 14px -> 0`, durasi `350ms`), dan otomatis nonaktif bila pengguna mengaktifkan `prefers-reduced-motion: reduce`.
4. **Transisi Tema Radial (`src/components/ThemeToggle.jsx` + `src/styles/base.css`):**
   * Pergantian tema Terang/Gelap memancarkan animasi `clip-path: circle()` secara halus (`460ms`, `cubic-bezier(0.22, 1, 0.36, 1)`) dari titik tengah tombol pengalih tema ke seluruh sudut viewport, dengan fallback instan bila `document.startViewTransition` tidak tersedia.

---

## 6. Keringkasan Teks & Tata Letak Modern (Clean UI)

* **Satu Informasi, Satu Tempat:** Hindari mengulang penjelasan yang sama di header kartu, subjudul, dan catatan kaki secara bersamaan.
* **Teks Singkat & Mudah Dipindai:** Gunakan kalimat maksimal 1-2 baris pada deskripsi hero, kartu alur, hint form, dan panel antrean agar tampilan bersih, modern, dan cepat dibaca.

---

## 7. Standar Responsivitas & Fluiditas Layar Seluler (Mobile-First, >= 320px)

Seluruh tampilan wajib tetap fungsional, nyaman disentuh, dan bebas *horizontal scroll* mulai dari lebar layar `320px` hingga desktop lebar:

* **Header Satu Baris (`src/components/AppHeader.jsx`):** Pada layar `< lg`, header tampil satu baris: merek di kiri, tombol tema dan menu akun di kanan. Ketukan pada logo merek (`ReportLoop`) mengembalikan pengguna ke tampilan kerja utama peran (`/user#lapor` untuk Mahasiswa, `/admin#antrean` untuk Admin). Navigasi utama, Profil, Mode data, dan Keluar berada di panel akun.
* **Navigasi Kembali di Layar Kecil (`ProfilePanel.jsx`, `UserPortalPage.jsx`, `AdminPortalPage.jsx`, `ReportDetailDialog.jsx`, `AuthShell.jsx`):**
  * Halaman **Profil** menampilkan tombol **Kembali** di bagian atas yang kembali ke tampilan kerja sebelumnya (`prevView`).
  * Sub-halaman Mahasiswa (**Papan Laporan** dan **Laporan Saya**) menyertakan tombol **Kembali ke Peta & Lapor** sejajar dengan **Buat Laporan Baru**, konsisten dengan tombol **Kembali ke Antrean** pada Peta Kampus Admin.
  * Dialog detail laporan menyediakan tombol **Kembali** di bilah aksi bawah dan mengembalikan fokus ke tombol pemicu saat ditutup.
  * Halaman autentikasi (`AuthShell.jsx`) menampilkan tautan **Beranda** di bilah atas sejajar logo pada layar `< lg`.
* **Menu Navigasi Rata Tengah & Akses Profil (`AppHeader.jsx`):** Daftar menu hanya berisi halaman kerja (Mahasiswa: *Peta & Lapor*, *Papan Laporan*, *Laporan Saya*; Admin Sarpras: *Antrean Triase*, *Peta Kampus*). Halaman Profil dibuka lewat tombol akun di pojok header.
* **Tinggi Peta Adaptif (`src/styles/map.css`):** Kontainer `#campus-map` menggunakan `height: clamp(220px, 38vh, 340px)` pada layar seluler dan `420px` pada desktop (`>= 1024px`).
* **Perlindungan Luapan Teks & Koordinat (`src/styles/base.css`, `ReportForm.jsx`):**
  * Aturan global `overflow-x: hidden`, `overflow-wrap: anywhere`, dan `word-break: break-word` mencegah judul atau deskripsi panjang merusak lebar kartu.
  * Input koordinat Latitude dan Longitude memakai susunan 1 kolom (`grid-cols-1`) di bawah `640px` dan 2 kolom (`sm:grid-cols-2`) di layar lebih lebar.
* **Posisi Toast Aman Layar Sempit (`src/components/ToastContainer.jsx`):** Kontainer toast memakai jangkar `left-3 right-3 bottom-4` pada layar `< 640px` dan `sm:right-5 sm:bottom-5 sm:max-w-sm` pada layar lebih besar.
* **Footer Ringkas (`src/components/AppFooter.jsx`):** Menampilkan identitas **ReportLoop â€¢ Polindra** dan **Tim Perintis â€¢ STACK 2026** dalam tata letak satu baris pada desktop dan bertumpuk rapi pada seluler.

---

## 7A. Navigasi Akun, Foto Profil, Kartu Laporan & Laporan Saya

* **Panel Akun (`src/components/AppHeader.jsx`):** Sheet di HP dan dropdown di desktop memakai satu komponen panel akun. Ditutup dengan Escape, klik latar, atau memilih item.
* **Foto Profil (`src/components/AvatarCropperDialog.jsx`, `src/services/auth.js`):**
  * Foto diunggah dari halaman Profil, dipangkas di dialog (geser dengan mouse atau sentuh, panah keyboard, penggeser zoom berlabel), lalu diperkecil ke 256x256 JPEG (`MAX_AVATAR_BYTES = 200 KB`) dan disimpan per akun di `localStorage` (`reportloop.avatar.<peran>.<id>`).
  * Tampil di header, panel akun, dan kartu identitas Profil, dengan inisial sebagai cadangan.
* **Kartu Laporan (`src/components/ReportCard.jsx`):**
  * **Ringkas sebelum klik:** Kartu memuat foto (atau placeholder kategori), status, kategori, judul, nama tempat (ikon pin + teks dari `getPlaceName()`), jumlah dukungan, dan tombol Dukung (bila tersedia). Koordinat tidak ditampilkan pada kartu ringkas agar tetap bersih dan mudah dipindai.
  * **Bentuk seragam & grid 2 kolom di layar kecil:** Kartu memakai tata letak `grid-cols-2 lg:grid-cols-3` agar di ponsel tampil 2 kartu berjejer per baris. Foto dan placeholder memakai tinggi `h-24 sm:h-32` dengan padding `p-3 sm:p-4`. Blok bawah didorong ke dasar kartu dengan `mt-auto`.
  * **Animasi halus (`MOTION 2`):** Dialog detail muncul dengan `opacity 0 -> 1` dan `translateY 14px -> 0` selama `350ms` (`cubic-bezier(0.22, 1, 0.36, 1)`). Foto kartu membesar `scale(1.03)` saat hover pada perangkat dengan penunjuk presisi (`hover: hover` dan `pointer: fine`). Semua animasi nonaktif saat `prefers-reduced-motion: reduce`.
  * **Bisa dibuka:** Judul kartu adalah tombol asli (`data-action="open-detail"`) yang area kliknya mengisi seluruh kartu (`after:absolute after:inset-0`). Tombol Dukung berada di lapisan atas (`z-10`).
* **Dialog Detail Laporan (`src/components/ReportDetailDialog.jsx`):**
  * Menggunakan `<dialog>` native (`showModal()`) dengan focus trap dan penutupan via tombol **Kembali**, `Escape`, atau klik backdrop.
  * Menampilkan foto atau placeholder, status dan kategori, deskripsi lengkap, **Lokasi** (nama tempat), **Koordinat** (teks monospace `lat, lng` tanpa ikon yang dapat diklik untuk langsung memfokuskan peta ke titik laporan), waktu kirim, ID laporan, jumlah dukungan, komponen pelacakan progres admin (`AdminTrackingBox.jsx`: `Diterima` -> `Diperbaiki` -> `Selesai`), riwayat status (`status_history`), tombol **Lihat di Peta**, tombol **Dukung**, dan tombol **Kembali**.
* **Papan Laporan (`src/pages/UserPortalPage.jsx`):** Empat kartu ringkasan status (*Semua laporan*, *Diterima*, *Diperbaiki*, *Selesai*) berfungsi sebagai filter dengan `aria-pressed`, dipadukan pencarian, pengurutan, dan chip kategori.
* **Laporan Saya (`src/components/MyReportsView.jsx`):** Halaman sendiri dengan tiga tab (*Laporan saya*, *Pembaruan*, dan *Didukung*), empat kartu ringkasan status yang dapat diklik sebagai filter, dan garis waktu perubahan status nyata dari `status_history`.

---

## 8. Aturan Anti-AI-Slop Tambahan

* **Aksen Warna:** Aksen hanya `--brand` (`#1d4ed8` / `#3b82f6`). Warna indigo/ungu bawaan Tailwind tidak dipakai sebagai aksen. Tidak ada gradien dua warna pada hero atau banner.
* **Ikon & Dekorasi:** Emoji tidak dipakai sebagai ikon fitur, judul, tombol, atau daftar. Gunakan Heroicons inline SVG. Tidak ada blob, gelombang, atau latar kisi tanpa fungsi.
* **Komponen:** Kartu tidak memakai garis tepi kiri berwarna bersama sudut membulat. Status ditandai badge status fungsional.
* **Konten:** Tidak ada angka atau klaim performa karangan; seluruh angka berasal dari data laporan nyata. Tidak ada tanda pisah em pada teks antarmuka baru.
* **Gambar:** Tidak memakai CDN gambar placeholder eksternal (`unsplash.com`, `placehold.co`, `picsum.photos`).
