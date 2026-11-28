import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle.jsx';
import { getSession, ROLE_HOME } from '../services/auth.js';

// Teks panel kiri, sama dengan frontend/html/{masuk,daftar,admin-masuk,admin-daftar}.html
const PANEL_COPY = {
  user: {
    login: {
      headline: 'Lihat fasilitas kampus yang rusak? Laporkan dari titik lokasinya.',
      body: 'Sematkan titik lokasi, unggah foto baru, dan kirim ke Sarpras Polindra. Dukungan menambah prioritas laporan yang sudah ada.',
    },
    register: {
      headline: 'Satu akun mahasiswa untuk melapor dan mendukung laporan teman.',
      body: 'Dengan akun, laporan Anda tercatat atas nama Anda dan dukungan Anda pada laporan lain dihitung satu kali per laporan.',
    },
  },
  admin: {
    login: {
      headline: 'Antrean laporan fasilitas, diurutkan dari yang paling banyak didukung.',
      body: 'Tinjau laporan mahasiswa, lihat lokasinya di peta, lalu ubah statusnya menjadi sedang diperbaiki atau selesai.',
    },
    register: {
      headline: 'Daftarkan akun petugas untuk menangani laporan fasilitas.',
      body: 'Pendaftaran admin memerlukan kode undangan dari unit Sarpras, supaya akun mahasiswa tidak bisa mengubah status laporan.',
    },
  },
};

export function AuthShell({
  role = 'user',
  mode = 'login',
  title,
  subtitle,
  children,
  footerNote = null,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const existing = getSession();
    if (existing?.role && ROLE_HOME[existing.role]) {
      navigate(ROLE_HOME[existing.role], { replace: true });
    }
  }, [navigate]);

  const isAdmin = role === 'admin';
  const roleCopy = PANEL_COPY[isAdmin ? 'admin' : 'user'];
  const copy = roleCopy[mode] || roleCopy.login;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--page)] text-[var(--ink)]">
      <main className="flex-1 grid lg:grid-cols-2">
        <section className="app-header relative overflow-hidden px-6 py-8 sm:px-10 lg:px-14 lg:py-12 flex flex-col justify-between gap-10">
          <div className="relative z-10 flex items-center justify-between gap-3">
            <Link to="/" className="text-xl font-extrabold tracking-tight hover:opacity-90">
              ReportLoop
            </Link>
            <div className="flex items-center gap-2 lg:hidden">
              <Link to="/" className="nav-link border border-white/35 px-2.5 min-h-[44px]">
                Beranda
              </Link>
              <ThemeToggle />
            </div>
          </div>

          <div className="relative z-10 max-w-md">
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">{copy.headline}</h1>
            <p className="mt-4 text-base text-blue-100 leading-relaxed">{copy.body}</p>
          </div>

          {!isAdmin && (
            <img
              src="/assets/img/gsc-polindra.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none select-none absolute bottom-0 right-0 w-[92%] sm:w-[82%] max-w-[540px] object-contain opacity-[0.17] mix-blend-luminosity translate-y-2 translate-x-2"
            />
          )}

          <div className="relative z-10 hidden lg:flex items-center justify-between gap-4 text-sm text-blue-100">
            <span>Politeknik Negeri Indramayu</span>
            <Link to="/" className="underline underline-offset-2 hover:text-white">
              Kembali ke Beranda
            </Link>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="hidden lg:block absolute top-6 right-6">
            <ThemeToggle variant="ghost" />
          </div>

          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-extrabold text-[var(--ink)]">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-[var(--ink-soft)]">{subtitle}</p>}

            <div className="mt-6">{children}</div>

            {footerNote && <div className="mt-6 text-xs text-[var(--ink-soft)]">{footerNote}</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
