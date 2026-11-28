# Product Requirements Document (PRD) - Frontend ReportLoop

**Versi:** 1.1 (React + Vite SPA - Fase Semifinal STACK 2026 - GDGoC ITB)
**Pemilik Modul:** M. Fadil Faiz (UI/UX Designer & Frontend Developer)
**Tim:** Tim Perintis - D4 Teknologi Rekayasa Komputer, Politeknik Negeri Indramayu
**Target Lingkungan:** Web App Responsif (*Mobile-First* & *Desktop*)

---

## 1. Ringkasan Produk & Tujuan Frontend

**ReportLoop** adalah aplikasi web pelacakan masalah fasilitas kampus dan lingkungan hunian mahasiswa berbasis lokasi peta dan dukungan kolektif (*upvote*). Frontend bertugas menggantikan alur pelaporan berbasis grup pesan (WhatsApp) yang tidak terstruktur menjadi antarmuka pelaporan yang cepat, transparan, dan terukur.

### Sasaran Utama Frontend
1. **Kemudahan Adopsi Pengguna:** Alur pelaporan maksimum 4 langkah (pilih titik peta, ambil foto, isi deskripsi singkat, kirim) agar mahasiswa dan pengelola yang terbiasa memakai WhatsApp tidak mengalami hambatan teknis.
2. **Transparansi Publik:** Menyediakan papan laporan terbuka (*Public Issue Board*) dengan indikator status nyata (`Received`, `In Progress`, `Resolved`), dialog detail laporan dengan koordinat interaktif menuju peta, dan mekanisme `+1 Upvote` sebagai penentu prioritas penanganan.
3. **Triase Efisien bagi Pengelola (Sarpras):** Menyediakan antrean laporan yang otomatis diurutkan berdasarkan jumlah dukungan terbanyak dan kategori divisi hasil klasifikasi NLP.
4. **Kesiapan Demo & Integrasi:** Mendukung **Mode Demo Interaktif** (*local fallback* tanpa server) dan **Mode Live FastAPI** secara mulus dalam satu antarmuka.

---

## 2. Pengguna & Peran (User Personas)

| Peran | Deskripsi | Hak Akses Utama |
| :--- | :--- | :--- |
| **Pengunjung / Publik** | Mahasiswa atau tamu yang membuka beranda (`/`) sebelum masuk. | Melihat ringkasan solusi ReportLoop, memantau pratinjau papan laporan publik (*read-only*), membuka detail laporan, dan berpindah ke halaman masuk/daftar. |
| **Mahasiswa (Pelapor)** | Penghuni kampus/asrama yang menemukan kerusakan fasilitas (`/user`). | Membuat laporan baru dengan foto & koordinat peta, melihat prediksi kategori NLP otomatis, memantau status laporan di **Laporan Saya**, serta memberikan `+1 Upvote` (1x per laporan). |
| **Admin Sarpras (Pengelola)** | Petugas sarana dan prasarana yang menindaklanjuti laporan (`/admin`). | Melihat ringkasan jumlah laporan per status, memfilter antrean berdasarkan kategori NLP dan status, meninjau koordinat di peta, serta mengubah status (`Received` -> `In Progress` -> `Resolved`). |

---

## 3. Ruang Lingkup Fitur: Semifinal vs. Final Day

Mengacu pada aturan **STACK 2026**, aplikasi Semifinal wajib berjalan utuh untuk alur inti (*Early Prototype*), namun harus menyisakan 2-3 tugas substantif untuk dikerjakan langsung saat **Build Session Final Day (16 Desember 2026)**.

### 3.1 Cakupan Wajib Semifinal (Deadline: 30 November 2026)
* **FR-01 Autentikasi Peran, Google OAuth & Isolasi Portal Sarpras (CIA):** Halaman masuk & daftar terpisah untuk Mahasiswa (`/masuk`, `/daftar` berbasis NIM + Email Google umum, atau *Masuk/Daftar dengan Google* OAuth) dan Admin Sarpras (`/admin-masuk`, `/admin-daftar` berbasis Email Google + Kode Undangan, atau Google OAuth dengan verifikasi kode undangan). Dilengkapi fitur **Lupa kata sandi** (`/lupa-password`) serta opsi **Ingat saya di perangkat ini** yang memperpanjang masa berlaku sesi dari 8 jam menjadi 7 hari. Portal masuk Admin Sarpras diisolasi dan tidak ditautkan di UI publik (`/`) maupun halaman Mahasiswa untuk meminimalkan permukaan serangan dan menjaga aspek keamanan CIA (*Confidentiality, Integrity, Availability*).
* **FR-02 Peta Interaktif Kampus (`CampusMap.jsx` / Leaflet.js):** Menampilkan area geofencing kampus Politeknik Negeri Indramayu, pin laporan aktif berdasarkan warna status, pin target laporan baru yang dapat diklik/digeser, preset titik cepat kampus, serta tombol lokasi GPS perangkat.
* **FR-03 Form Pelaporan (`ReportForm.jsx`, Foto Bukti Maks. 24 Jam) & Pratinjau NLP Real-Time:** Input judul, deskripsi, koordinat otomatis dari peta, unggah foto bukti melalui dua opsi: ambil foto langsung dari kamera (`capture="environment"`) atau pilih file foto terbaru (JPG, PNG, atau WebP, maks. 5 MB), serta pratinjau kategori otomatis (*Infrastructure*, *Cleanliness*, *Security*). Foto yang terdeteksi lebih dari 24 jam ditolak sistem sehingga tidak dapat dikirim.
* **FR-04 Pencegahan Laporan Duplikat (Radius 15 Meter â€” `DuplicateModal.jsx`):** Mendeteksi laporan aktif berkategori sama dalam jarak <= 15 meter (Haversine di mode demo / PostGIS `ST_DWithin` di mode live) dan menampilkan modal konfirmasi untuk mengalihkan pengguna ke tombol `+1 Upvote` atau mengirim paksa (`force_submit=true`).
* **FR-05 Papan Laporan Publik, Laporan Saya, Detail Laporan & Upvote:**
  * **Papan Laporan (`/user#papan`):** Menampilkan seluruh laporan umum dengan pencarian kata kunci, filter kategori, kartu ringkasan status yang bisa diklik sebagai filter (*Semua*, *Diterima*, *Diperbaiki*, *Selesai*), pengurutan (dukungan terbanyak / terbaru), serta tombol *Upvote* toggle (1 dukungan per pengguna per laporan, dapat diklik kembali untuk membatalkan dukungan).
  * **Kartu Laporan (`ReportCard.jsx`):** Menampilkan foto, status, kategori, judul, nama tempat (dari `place_name` atau titik kampus terdekat radius 80 m), jumlah dukungan, dan tombol Dukung.
  * **Dialog Detail Laporan (`ReportDetailDialog.jsx`):** Membuka rincian lengkap saat kartu diklik: foto, status & kategori, deskripsi lengkap, nama tempat (**Lokasi**), teks **Koordinat** (`lat, lng`) yang dapat diklik untuk langsung memfokuskan peta kampus ke titik lokasi laporan, waktu kirim, ID laporan, jumlah dukungan, komponen pelacakan progres 3 tahap (`AdminTrackingBox.jsx`: `Diterima` -> `Diperbaiki` -> `Selesai`), riwayat status (`status_history`), dan tombol aksi (**Lihat di Peta**, **Dukung**, **Kembali**).
  * **Laporan Saya (`/user#laporan-saya` / `MyReportsView.jsx`):** Terdiri dari tiga tab: *Laporan saya* (empat kartu ringkasan status sebagai filter, chip status, pencarian, dan urutan), *Pembaruan* (garis waktu perubahan status dari `status_history` nyata, terbaru di atas), dan *Didukung*.
  * **Profil (`/user#profil` / `ProfilePanel.jsx`):** Memuat identitas akun, pemangkas & unggah foto profil (`AvatarCropperDialog.jsx`, JPEG 256x256 tersimpan per akun di `localStorage` pada mode demo), dan pintasan navigasi.
* **FR-06 Panel Triase Admin Sarpras (`/admin` / `AdminPortalPage.jsx`):** Ringkasan KPI riil dari jumlah laporan, antrean laporan terurut berdasarkan dukungan tertinggi, filter divisi & status, tombol aksi perubahan status bertahap, serta tampilan peta kampus (`/admin#peta`) untuk memeriksa titik lokasi laporan.
* **FR-07 Tema Terang (Soft-White) & Gelap (`ThemeToggle.jsx`):** Pengalih tema biru-putih lembut (*soft-white*, tidak terlalu putih agar tidak menyilaukan) dan biru-slate gelap dengan animasi transisi radial, tersimpan di `localStorage` serta menghormati preferensi sistem.

### 3.2 Ruang Lingkup Disisakan untuk Final Day (16 Desember 2026)
Fitur berikut **tidak boleh** diklaim selesai pada demo/proposal Semifinal:
* **FD-01 Notifikasi Real-Time ke Pelapor:** Pemberitahuan langsung (in-app / webhook) ketika status laporan diubah oleh Admin.
* **FD-02 Ekspor Rekapitulasi Bulanan (PDF / CSV):** Laporan statistik bulanan dan rata-rata waktu penyelesaian (*Mean Time to Resolution*).
* **FD-03 Klasterisasi Marker & Komentar Tindak Lanjut:** Pengelompokan marker padat pada peta serta kolom komentar diskusi warga/admin.

---

## 4. Alur Pengguna Utama (Core User Flows)

### Flow A: Pelaporan Kerusakan oleh Mahasiswa
1. Mahasiswa masuk melalui `/masuk` (atau daftar di `/daftar`) dan diarahkan ke `/user`.
2. Mahasiswa menentukan titik lokasi dengan mengklik peta Leaflet (`CampusMap.jsx`), menggeser pin biru, memilih preset lokasi kampus, atau menekan tombol GPS.
3. Mahasiswa mengisi **Judul Keluhan** dan **Deskripsi Kondisi** -> komponen pratinjau NLP menampilkan prediksi kategori dan tingkat keyakinan (*confidence*).
4. Mahasiswa melampirkan **Foto Bukti Terbaru** melalui tombol **Ambil foto** (kamera langsung) atau **Pilih file foto** (maksimal usia foto 24 jam).
5. Saat tombol **Kirim laporan** ditekan:
   * *Validasi 1 (Kesegaran Foto):* Jika foto terdeteksi > 24 jam, tampilkan banner peringatan `STALE_PHOTO_REJECTED` (HTTP 400) dan hentikan pengiriman.
   * *Validasi 2 (Duplikat Spasial <= 15m):* Jika ditemukan laporan aktif berkategori sama dalam radius 15 meter, buka `DuplicateModal` (HTTP 409) agar mahasiswa mendukung laporan yang sudah ada atau memilih tetap kirim baru.
   * *Sukses:* Laporan ditambahkan ke Zustand store / backend dengan status awal `Received` (`Diterima`) dan `1` dukungan awal.

### Flow B: Triase & Pembaruan Status oleh Admin Sarpras
1. Petugas Sarpras mengakses portal login terpisah secara langsung melalui `/admin-masuk` (atau subdomain khusus Sarpras di produksi, terpisah dari UI publik/mahasiswa) dan diarahkan ke `/admin`.
2. Admin melihat ringkasan jumlah laporan (`Semua`, `Menunggu ditangani`, `Sedang diperbaiki`, `Selesai`) dan antrean yang otomatis diurutkan berdasarkan jumlah dukungan terbanyak.
3. Admin dapat memfilter berdasarkan kategori divisi NLP (`Infrastructure`, `Cleanliness`, `Security`) atau status, lalu mengklik **Peta** atau koordinat di dialog detail untuk memeriksa lokasi tepat kerusakan.
4. Admin mengubah status menjadi **Diperbaiki** (`Received` -> `In Progress`) atau **Selesai** (`In Progress` -> `Resolved`). Perubahan langsung diperbarui pada papan publik, warna pin peta, serta tercatat dalam riwayat `status_history` agar mahasiswa dapat melacak progres pengerjaan secara transparan.

---

## 5. Kontrak API Frontend - Backend (FastAPI Specification)

Dokumen ini menjadi acuan sinkronisasi antara **Frontend (`frontend-react/src/services/api.js`)** dan **Backend (`backend/main.py`)**:

| Metode | Endpoint | Payload / Query | Respons Sukses | Penanganan Error di FE |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reports` | Optional: `?category=&status=&reporter_id=&sort=` | `200 OK` - Array objek `Report` | Fallback ke `SEED_REPORTS` (Mode Demo) dengan toast peringatan. |
| `POST` | `/api/reports` | `multipart/form-data`: `title`, `description`, `latitude`, `longitude`, `force_submit` (`bool`), `photo` (`file`) | `201 Created` - Objek `Report` baru hasil klasifikasi NLP | `400` (`STALE_PHOTO_REJECTED`): tampilkan banner foto lama.<br>`409` (`DUPLICATE_NEARBY_REPORT`): buka modal laporan serupa. |
| `POST` | `/api/reports/{id}/upvote` | Header `Authorization: Bearer <token>` | `200 OK` - Objek `Report` dengan `upvotes` terbaru | `409` (`ALREADY_UPVOTED`) jika sudah pernah upvote; sinkronkan state lokal. |
| `DELETE` | `/api/reports/{id}/upvote` | Header `Authorization: Bearer <token>` | `200 OK` - Objek `Report` dengan `upvotes` terbaru | Batalkan dukungan pengguna dan perbarui tampilan tombol. |
| `PATCH` | `/api/reports/{id}/status` | JSON `{ "status": "In Progress" \| "Resolved" }` + Header Admin | `200 OK` - Objek `Report` dengan status terbaru | `403` (`FORBIDDEN`) jika bukan Admin; tampilkan toast gagal dan kembalikan dropdown ke status semula. |
| `POST` | `/api/auth/google` | JSON `{ "credential", "role", "nim?", "invite_code?" }` | `200 OK` - `{ "id", "email", "name", "token" }` | `422` (`NIM_REQUIRED` / `INVITE_REQUIRED`): buka modal lengkapi data. |

### Skema Objek `Report` (JSON)

Lapisan `src/services/api.js` menormalisasi respons `backend/main.py` lewat `normalizeReport()` agar seluruh komponen React kompatibel tanpa perlu diubah:
* `user_id`: diisi otomatis dari `raw.user_id ?? raw.reporter_id`.
* `photo_url`: jika diawali `/uploads/`, digabung dengan `FASTAPI_BASE_URL` agar foto dari FastAPI langsung tampil.
* `place_name`: memakai `raw.place_name` bila tersedia; jika kosong, diturunkan otomatis lewat `getPlaceName()` (radius 80 m dari `CAMPUS_PLACES`, fallback `"Area kampus"`).
* `status_history`: memakai `Array.isArray(raw.status_history) ? raw.status_history : []` agar dialog detail dan tab *Pembaruan* tetap jujur sesuai data nyata.

```json
{
  "id": "rep-001",
  "reporter_id": "2509015",
  "reporter_name": "Ibrahim Movik",
  "title": "Lampu lorong lantai 2 padam",
  "description": "Lampu penerangan koridor lantai 2 mati sejak kemarin malam.",
  "photo_url": "/uploads/rep-001.jpg",
  "photo_verification": "Verified (Fresh camera photo)",
  "latitude": -6.4085,
  "longitude": 108.2815,
  "place_name": "Koridor Gedung Kuliah Lt. 2",
  "category": "Infrastructure",
  "nlp_confidence": 0.91,
  "status": "In Progress",
  "upvotes": 14,
  "created_at": "2026-11-22T08:15:00+07:00",
  "status_history": [
    {
      "from": "Received",
      "to": "In Progress",
      "by": "Petugas Sarpras",
      "at": "2026-11-23T09:00:00+07:00"
    }
  ]
}
```

---

## 6. Standar Non-Fungsional & Kualitas Web App

1. **Responsivitas & Target Sentuh:** Bebas *horizontal scroll* mulai lebar layar `320px` hingga `1440px`; seluruh tombol, tab, koordinat klikable, dan input memiliki tinggi sentuh minimal `44px`.
2. **Aksesibilitas (WCAG AA & Keyboard):** Rasio kontras teks minimal `4.5:1` pada Mode Terang maupun Mode Gelap; seluruh kontrol dan dialog `<dialog>` dapat dinavigasi dengan `Tab`, `Enter`, panah keyboard, dan `Escape` dengan indikator fokus jelas.
3. **Ketahanan State UI:** Setiap tampilan data menyediakan *Loading State*, *Empty State* (penjelasan penyebab + tombol aksi), dan *Error State* (pesan galat + toast umpan balik).
4. **Keringkasan Teks & Tata Letak Clean:** Teks antarmuka dibuat ringkas, tidak berulang di banyak area, dan informasi pendukung disatukan di satu tempat agar tampilan modern, bersih, dan mudah dipindai.
