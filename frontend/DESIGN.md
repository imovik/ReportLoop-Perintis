# Design System & Visual Direction (DESIGN.md) — ReportLoop

**Produk:** ReportLoop — Pelaporan Fasilitas Kampus Politeknik Negeri Indramayu  
**Dial Desain:** `ENERGY 2 / RHYTHM 2 / MOTION 2`  
**Referensi Struktur Visual:** Adaptasi komposisi editorial modern dengan palet **Biru–Putih (Light Mode)** dan **Biru–Slate Gelap (Dark Mode)** yang bersih, terstruktur, dan bebas *AI slop*.

---

## 1. Identitas Visual & Adaptasi dari Referensi Gambar

Komposisi visual pada referensi gambar diterapkan secara fungsional untuk kebutuhan **ReportLoop** tanpa menyalin elemen dekoratif yang tidak relevan:

1. **Split Hero dengan Pratinjau Produk Nyata (`index.html`):**
   * **Sisi Kiri (Fokus Tipografi & Aksi):** Judul utama tegas dengan penekanan warna biru merek (`#1d4ed8` pada Light Mode / `#60a5fa` pada Dark Mode) pada frasa kunci (*"Dari Titik Lokasinya."*), deskripsi ringkas alur pelaporan, dan tombol aksi utama untuk masuk sebagai Mahasiswa (portal login Admin Sarpras diisolasi di URL/domain terpisah demi keamanan CIA).
   * **Sisi Kanan (Pratinjau Antarmuka & Bentuk Aksen Geometri):** Bingkai pratinjau aplikasi ReportLoop (peta kampus + kartu status laporan) di atas bidang aksen biru solid melengkung di sudut kanan atas — menjadi satu-satunya bidang aksen besar di halaman agar mata langsung tertuju pada pratinjau produk.
2. **Ritme Section Bervariasi (`RHYTHM 2`):**
   * **Alur 3 Langkah Inti (Kartu Bertumpuk):** Tiga kartu bertumpuk dengan ikon Heroicons berbingkai tipis di atas label ringkas (*1. Sematkan Titik Peta*, *2. Klasifikasi Otomatis NLP*, *3. Triase & Upvote Kolektif*). Kartu paling atas digeser lewat sentuh layar atau seret mouse. Titik indikator di bawahnya bisa diklik, dan panah kiri/kanan keyboard juga berfungsi. Tidak ada tombol panah terpisah dan tidak ada geser otomatis.
   * **Section Split Tentang Sistem & Alur:** Penjelasan peran ganda (Mahasiswa Pelapor & Admin Sarpras) dengan daftar poin berikon centang dan pratinjau ringkasan status.
   * **Papan Laporan Publik Langsung (*Live Public Preview*):** Menampilkan kartu laporan nyata dari data aplikasi (bukan mockup statis), lengkap dengan indikator tahapan progres pengerjaan admin (`Diterima`, `Diperbaiki`, `Selesai`).
   * **Banner Aksi Penutup (*Callout Card*):** Kartu biru solid berujung membulat (`rounded-2xl`) di bagian bawah untuk ajakan langsung masuk/membuat laporan sebagai Mahasiswa.
3. **Penyesuaian Kejujuran Data (Aturan Anti-Slop R-17 & R-18):**
   * Elemen statistik karangan pada referensi gambar (seperti `120+ Clients`, `250+ Projects`, `8+ Years`) **tidak digunakan**. Angka yang ditampilkan di ReportLoop hanya berasal dari hitungan data laporan nyata (jumlah laporan diterima, diproses, selesai, dan jumlah dukungan).

---

## 2. Sistem Warna: Light Mode & Dark Mode (Biru–Putih)

Palet dibatasi pada **2 warna inti (Putih/Slate netral + Biru Merek)** ditambah **3 warna status fungsional** yang hanya muncul pada badge status dan pin peta.

### 2.1 Token Warna Light Mode (`:root` / Default - Soft-White Anti-Silau)
Palet terang menggunakan *soft-white* (putih tidak terlalu putih/mencolok) untuk menjaga kenyamanan baca bagi mahasiswa bermata minus maupun petugas Sarpras senior.
* **Latar Utama (`--bg-page`):** `#f1f5f9` (Soft-white abu-biru lembut, mengurangi silau layar).
* **Permukaan Kartu (`--bg-surface`):** `#f8fafc` (Putih lembut dengan garis tepi `1px solid #cbd5e1`, bukan `#ffffff` murni yang menyilaukan).
* **Permukaan Sekunder (`--bg-subtle`):** `#e8f0fe` (Biru lembut untuk sorotan info NLP & kartu ringkasan).
* **Teks Utama (`--text-primary`):** `#0f172a` (Kontras > 13:1 terhadap latar soft-white).
* **Teks Sekunder (`--text-secondary`):** `#475569` (Kontras > 6:1 terhadap latar soft-white, lolos WCAG AA).
* **Warna Merek Utama (`--brand`):** `#1d4ed8` (Biru Cobalt tegas; hover `#1e40af`).
* **Garis Pembatas (`--border`):** `#cbd5e1`.

### 2.2 Token Warna Dark Mode (`html.dark`)
* **Latar Utama (`--bg-page`):** `#090e1a` (Biru malam sangat gelap, bukan hitam pekat agar nyaman di mata).
* **Permukaan Kartu (`--bg-surface`):** `#111827` (Slate biru gelap dengan garis tepi `1px solid #1e293b`).
* **Permukaan Sekunder (`--bg-subtle`):** `#172554` (Biru tua lembut untuk kotak prediksi NLP & sorotan aktif).
* **Teks Utama (`--text-primary`):** `#f8fafc` (Putih bersih, kontras > 15:1).
* **Teks Sekunder (`--text-secondary`):** `#cbd5e1` (Abu-biru terang, kontras > 9:1).
* **Warna Merek Utama (`--brand`):** `#3b82f6` untuk tombol/sorotan latar & `#60a5fa` untuk teks tautan/aksen judul (kontras > 6:1 di latar gelap).
* **Garis Pembatas (`--border`):** `#1e293b`.

### 2.3 Warna Status Fungsional (Konsisten di Kedua Tema)
| Status | Light Mode (Latar / Teks) | Dark Mode (Latar / Teks) | Pin Peta |
| :--- | :--- | :--- | :--- |
| **Received (Diterima)** | `#fef3c7` / `#78350f` | `#451a03` / `#fcd34d` | `#b45309` |
| **In Progress (Diperbaiki)** | `#dbeafe` / `#1e3a8a` | `#1e3a8a` / `#93c5fd` | `#1d4ed8` |
| **Resolved (Selesai)** | `#dcfce7` / `#14532d` | `#052e16` / `#86efac` | `#15803d` |

### 2.4 Token Pendukung (Galat, Netral Tambahan, Teks di Atas Merek)
Didefinisikan di `css/base.css` pada `:root` dan `html.dark`. Warna galat hanya muncul pada keadaan error (teks galat, field tidak valid, tombol hapus/bahaya), bukan sebagai aksen dekoratif.
| Token | Light Mode | Dark Mode | Fungsi |
| :--- | :--- | :--- | :--- |
| `--danger` | `#dc2626` | `#dc2626` | Garis field tidak valid, teks galat di mode terang |
| `--danger-ink` | `#991b1b` | `#fca5a5` | Teks tombol bahaya dan teks galat di mode gelap |
| `--danger-line` | `#fecaca` | `#7f1d1d` | Garis tepi tombol bahaya |
| `--danger-soft` | `#fef2f2` | `#450a0a` | Latar hover tombol bahaya |
| `--muted` | `#64748b` | `#94a3b8` | Teks placeholder input |
| `--line-strong` | `#94a3b8` | `#94a3b8` | Garis tepi input saat hover |
| `--on-brand` | `#ffffff` | `#ffffff` | Teks/ikon di atas bidang warna merek |

Catatan: `.badge-cat` memakai `#e8eef7` (terang) dan `#1e293b` (gelap) sebagai latar kategori netral, dan beberapa aturan header mode gelap sengaja memakai nilai tetap agar kontras teks putih tetap di atas 4,5:1.

---

## 3. Tipografi & Hierarki Skala

* **Font Utama (`--font-sans`):** `Plus Jakarta Sans` — dipilih karena proporsi hurufnya jernih untuk kalimat Bahasa Indonesia dan antarmuka operasional kampus.
* **Font Monospace (`--font-mono`):** `JetBrains Mono` — digunakan khusus pada angka koordinat GPS (`-6.40850, 108.28150`), ID laporan (`#rep-001`), dan persentase keyakinan NLP agar digit sejajar vertikal.
* **Skala Ukuran:**
  * Hero Headline (`h1`): `clamp(2rem, 4vw, 3rem)`, `font-weight: 800`, `line-height: 1.15`, `letter-spacing: -0.025em`.
  * Judul Section (`h2`): `1.375rem` – `1.75rem`, `font-weight: 800`, `letter-spacing: -0.015em`.
  * Judul Kartu (`h3`): `1rem` – `1.125rem`, `font-weight: 700`.
  * Teks Isi & Form: `0.9375rem` – `1rem` (`16px` pada input mobile untuk mencegah *auto-zoom* iOS).

---

## 4. Sistem Komponen, Radius & Elevasi

* **Hierarki Radius (`R-11`):**
  * Kartu utama & panel peta: `14px` (`0.875rem`).
  * Input form, tombol standar, & badge status: `8px` (`0.5rem`).
  * Filter chip kategori & indikator aktif: `9999px` (pill khusus kontrol filter).
* **Elevasi & Bayangan (`R-12`):**
  * Kartu di atas kanvas memakai garis tepi `1px solid var(--border)` tanpa bayangan tebal.
  * Bayangan lembut hanya dipakai pada elemen melayang: header sticky (`shadow-sm`), pin koordinat di atas peta, dan modal dialog konfirmasi duplikat.
* **Standar Target Sentuh & Fokus (`R-03`, `R-32`):**
  * Seluruh tombol interaktif, chip filter, tab, dan tombol toggle tema memiliki tinggi minimal `44px` (`min-h-[44px]`).
  * Fokus keyboard memakai `outline: 2px solid var(--brand)` dengan `outline-offset: 2px`.

---

## 5. Pustaka Eksternal & Aset Fungsional

Untuk menjaga performa tetap ringan tanpa *bundler* pada tahap Vanilla sebelum migrasi ke React:
1. **Heroicons (Inline SVG 24x24, Stroke `1.75`):** Dipakai secara konsisten sebagai ikon fungsional (pin lokasi peta, kamera foto bukti, pencarian, filter, jempol dukungan/upvote, pengalih tema matahari/bulan, dan tanda centang status).
2. **Leaflet.js `1.9.4` + Tile OpenStreetMap / CartoDB Dark Matter:**
   * Mode Terang menggunakan tile peta standar yang terang.
   * Mode Gelap menyesuaikan tampilan kontainer peta agar tidak menyilaukan mata pengguna.
3. **Scroll Reveal Engine (`IntersectionObserver` Native):**
   * Menggunakan `IntersectionObserver` ringan (`js/utils/scrollReveal.js`) untuk memunculkan section dan kartu secara halus saat digulir (`opacity: 0 -> 1`, `translateY: 14px -> 0`, durasi `350ms`).
   * Otomatis dinonaktifkan jika sistem pengguna mengaktifkan `prefers-reduced-motion: reduce`.
4. **Transisi Tema Radial (`View Transitions API`):**
   * Pergantian tema Terang/Gelap (`js/utils/theme.js` + `css/base.css`) memancarkan animasi `clip-path: circle()` secara halus (`460ms`, `cubic-bezier(0.22, 1, 0.36, 1)`) dari titik tengah tombol pengalih tema (`[data-theme-toggle]`) ke seluruh sudut viewport.
   * Secara otomatis jatuh kembali (*fallback*) ke pergantian instan apabila browser belum mendukung `document.startViewTransition` atau pengguna mengaktifkan `prefers-reduced-motion: reduce`.

---

## 6. Keringkasan Teks & Tata Letak Modern (Clean UI)

* **Satu Informasi, Satu Tempat:** Hindari mengulang penjelasan yang sama di header kartu, subjudul, dan catatan kaki secara bersamaan. Satukan panduan singkat di satu tempat yang paling relevan.
* **Teks Singkat & Mudah Dipindai:** Gunakan kalimat maksimal 1-2 baris pada deskripsi hero, kartu alur, hint form, dan panel antrean agar tampilan bersih, modern, dan cepat dibaca.

---

## 7. Standar Responsivitas & Fluiditas Layar Seluler (Mobile-First, >= 320px)

Seluruh tampilan wajib tetap fungsional, nyaman disentuh, dan bebas *horizontal scroll* mulai dari lebar layar `320px` hingga desktop lebar:

* **Header Kompak 2 Tingkat (`html/header.html`):** Pada layar `< lg`, header disusun maksimal 2 baris vertikal (baris merek + kontrol cepat Profil/Tema/Keluar di atas; baris navigasi utama + tombol Mode Demo kompak di bawah) agar ruang vertikal viewport tetap lapang untuk konten utama.
* **Menu Navigasi Rata Tengah & Akses Profil (`html/header.html`, `js/features/header.js`):** Daftar menu hanya berisi halaman kerja (Mahasiswa: *Peta & Lapor*, *Papan Laporan*; Admin Sarpras: *Antrean Triase*, *Peta Kampus*). Halaman Profil tidak lagi menjadi item menu karena sudah dibuka lewat tombol akun di pojok header (ikon profil pada layar `< lg`, avatar + nama pada `>= xl`; pada `lg` hanya avatar dengan `aria-label`). Pada layar `>= xl` header memakai grid `1fr auto 1fr` agar menu tepat di tengah halaman untuk peran Mahasiswa maupun Admin; pada `lg` memakai flex dengan menu rata tengah di ruang antara merek dan kontrol kanan, sedangkan label teks tombol Tema dan nama profil disembunyikan agar tidak meluap.
* **Jarak Section Ringkas (`index.html`):** Section Alur Pelaporan dan Peran Sistem memakai `py-10` pada seluler dan `sm:py-12` dari `640px` ke atas, judul ke konten `mb-6`, dan kartu ke titik indikator `mt-4 sm:mt-5`. Dengan begitu kartu 3 langkah tidak terpisah jauh dari section di bawahnya di semua ukuran layar. Section Papan Publik tetap `py-14`.
* **Tinggi Peta Adaptif (`css/map.css`):** Kontainer `#campus-map` menggunakan `height: clamp(220px, 38vh, 340px)` pada layar seluler dan `420px` pada desktop (`>= 1024px`) sehingga peta tetap nyaman disentuh tanpa mendorong formulir laporan terlalu jauh ke bawah.
* **Perlindungan Luapan Teks & Koordinat (`css/base.css`, `view-mahasiswa.html`):**
  * Aturan global `overflow-x: hidden`, `overflow-wrap: anywhere`, dan `word-break: break-word` mencegah judul atau deskripsi tanpa spasi merusak lebar kartu, sementara elemen `.font-mono` dan input menjaga keterbacaan angka.
  * Input koordinat Latitude dan Longitude memakai susunan 1 kolom (`grid-cols-1`) di bawah `640px` dan 2 kolom (`sm:grid-cols-2`) di layar lebih lebar.
* **Tombol, Tab & Kartu KPI Responsif (`css/base.css`, `view-mahasiswa.html`, `view-admin.html`):**
  * Kelas `.btn` mengizinkan `flex-wrap`, `max-width: 100%`, dan lebar penuh (`w-full sm:w-auto`) pada tombol aksi sejajar di seluler sambil mempertahankan target sentuh minimal `44px`.
  * Tab papan laporan (`.tab`) menggunakan padding kompak (`0.5rem 0.625rem`, `0.8125rem`) dengan wadah gulir horizontal opsional agar seluruh tab tetap terbaca jelas pada layar `320px-360px`.
  * Kartu ringkasan KPI pada panel admin (`view-admin.html`) memakai garis pemisah vertikal internal pada kolom ganjil (`border-r`) serta skala angka `text-2xl sm:text-3xl`.
* **Posisi Toast Aman Layar Sempit (`html/header.html`):** Kontainer `#toast-container` memakai jangkar `left-3 right-3 bottom-4` pada layar `< 640px` dan `sm:right-5 sm:bottom-5 sm:max-w-sm` pada layar lebih besar agar notifikasi tidak pernah terpotong di tepi kiri layar.
* **Komponen Pelacakan Progres Admin (User View):** Ditampilkan ringkas di dalam kartu laporan (`publicBoard.js`) dan daftar laporan pada halaman Profil (`profile.js`) menggunakan 3 tahap berurutan (`Diterima` -> `Diperbaiki` -> `Selesai`) dengan warna status yang sudah ditetapkan, garis penghubung netral (`1px solid var(--border)` atau aksen biru merek pada tahap aktif/selesai), radius `8px` pada blok rincian riwayat, serta tanpa animasi berulang atau badge hiasan berlebihan. Jika `status_history` kosong, tampilkan status berjalan secara jujur tanpa mengarang riwayat palsu.

---

## 8. Aturan Anti-AI-Slop Tambahan

Melengkapi bagian 1 sampai 7 dan aturan `antislop` proyek. Setiap butir bisa diperiksa langsung pada kode.

* **Aksen Warna:**
  * Aksen hanya `--brand` (`#1d4ed8` / `#3b82f6`). Warna indigo/ungu bawaan Tailwind (`#6366f1`, `#4f46e5`, `#4338ca`, `#3730a3`, `#8b5cf6`, `#7c3aed`, `#a855f7`) tidak dipakai sebagai aksen.
  * Tidak ada gradien dua warna pada hero atau banner (ungu ke biru, biru ke cyan, indigo ke pink). Bidang aksen tetap biru solid sesuai bagian 1.
  * Aksen merek dipakai hemat: maksimal 2 titik sorotan per layar selain tombol aksi utama.
  * Nilai heksadesimal ditulis sebagai token di `:root` dan `html.dark`. Heksadesimal mentah di luar token dihindari.
* **Ikon & Dekorasi:**
  * Emoji tidak dipakai sebagai ikon fitur, judul, tombol, atau daftar. Gunakan Heroicons inline SVG sesuai bagian 5.
  * Tidak ada ikon generik tanpa relevansi (kilat, bintang, sparkle, robot, orb).
  * Tidak ada bentuk blob, gelombang, atau latar kisi tanpa fungsi.
* **Komponen:**
  * Kartu tidak memakai garis tepi kiri berwarna bersama sudut membulat. Pilih salah satu: hapus garis kiri atau pakai radius standar bagian 4.
  * Status ditandai badge status fungsional (bagian 2.3), bukan kapsul hiasan seperti "Baru" atau "AI Powered".
* **Konten:**
  * Tidak ada angka, persentase, atau klaim performa karangan (misalnya "10x lebih cepat", "99,9% aktif"). Angka hanya dari data laporan nyata.
  * Tidak ada teks isian: `lorem ipsum`, "fitur satu/dua/tiga", "teks contoh". Bagian tanpa data memakai keadaan kosong yang jujur.
  * Tombol aksi memakai kata kerja spesifik (*Buat Laporan Baru*, *Buka Papan Laporan*), bukan "Mulai" atau "Pelajari lebih lanjut".
  * Tidak ada tanda pisah em (â€”) pada teks antarmuka baru. Pakai koma, titik, titik dua, atau tanda kurung.
* **Gambar:** Tidak memakai CDN gambar placeholder eksternal (`unsplash.com`, `placehold.co`, `picsum.photos`). Gambar berasal dari `assets/img/` atau foto bukti laporan pengguna.
* **Pemeriksaan Sebelum Rilis:** Setiap keputusan visual besar (warna, tata letak, tipografi, ikon) punya alasan satu kalimat. Jika tidak bisa dituliskan, keputusan itu ditinjau ulang.
