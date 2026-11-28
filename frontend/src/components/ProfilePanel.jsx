import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarCropperDialog, validateAvatarFile } from './AvatarCropperDialog.jsx';
import { useAppStore } from '../store/useAppStore.js';
import {
  clearProfilePhoto,
  getProfilePhoto,
  logout,
  ROLE_HOME,
  ROLE_LOGIN,
  setProfilePhoto,
  updateSessionProfile,
} from '../services/auth.js';

function getInitials(name) {
  return (
    String(name || 'U')
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] || '')
      .join('')
      .toUpperCase() || 'U'
  );
}

export function ProfilePanel({ session, onSessionChange, onBack, onNavigateSection }) {
  const navigate = useNavigate();
  const isLiveApi = useAppStore((s) => s.isLiveApi);
  const logoutSession = useAppStore((s) => s.logoutSession);
  const pushToast = useAppStore((s) => s.pushToast);

  const fileInputRef = useRef(null);
  const [pendingCropFile, setPendingCropFile] = useState(null);
  const [photo, setPhoto] = useState(() => getProfilePhoto(session));
  const [name, setName] = useState(session?.name || '');
  const [email, setEmail] = useState(session?.email || '');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setPhoto(getProfilePhoto(session));
    setName(session?.name || '');
    setEmail(session?.email || '');
    setErrorMsg('');
  }, [session]);

  if (!session) return null;

  const isAdmin = session.role === 'admin';
  const roleTitle = isAdmin ? 'Petugas Admin Sarpras' : 'Mahasiswa Pelapor';
  const idLabel = isAdmin ? 'Email Terdaftar' : 'Nomor Induk Mahasiswa (NIM)';
  const authMethodLabel =
    session.provider === 'google'
      ? 'Google OAuth'
      : isAdmin
        ? 'Email & Kata Sandi'
        : 'NIM & Kata Sandi';
  const sessionDurationLabel = session.rememberMe ? '7 hari (Ingat Saya)' : '8 jam';
  const registeredEmail = session.email || (isAdmin ? session.id : 'Belum diatur');
  const initials = getInitials(session.name);
  const backLabel = isAdmin ? 'Kembali ke Antrean' : 'Kembali';

  const handleNavigate = (targetSection) => {
    if (typeof onNavigateSection === 'function') {
      onNavigateSection(targetSection);
      return;
    }
    navigate(`${ROLE_HOME[session.role] || '/'}#${targetSection}`);
  };

  const handleBackClick = () => {
    if (typeof onBack === 'function') {
      onBack();
      return;
    }
    navigate(ROLE_HOME[session.role] || '/');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const problem = validateAvatarFile(file);
    if (problem) {
      pushToast(problem, 'error');
      return;
    }
    setPendingCropFile(file);
  };

  const handleCropConfirm = (dataUrl) => {
    try {
      setProfilePhoto(dataUrl);
      const latestPhoto = getProfilePhoto(session);
      setPhoto(latestPhoto);
      setPendingCropFile(null);
      onSessionChange?.({ ...session });
      pushToast('Foto profil diperbarui.', 'success');
    } catch (err) {
      pushToast(err?.message || 'Foto gagal disimpan.', 'error');
    }
  };

  const handleRemovePhoto = () => {
    clearProfilePhoto();
    setPhoto(null);
    onSessionChange?.({ ...session });
    pushToast('Foto profil dihapus. Inisial dipakai kembali.', 'info');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);
    try {
      const updates = { name };
      if (!isAdmin) {
        updates.email = email;
      }
      const updated = updateSessionProfile(updates);
      onSessionChange?.(updated);
      pushToast('Profil akun berhasil diperbarui.', 'success');
    } catch (err) {
      const message = err?.message || 'Gagal memperbarui profil akun.';
      setErrorMsg(message);
      pushToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    logoutSession();
    navigate(ROLE_LOGIN[session.role] || '/masuk', { replace: true });
  };

  return (
    <section aria-label="Profil dan pengaturan akun">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleBackClick}
          className="btn btn-sm btn-ghost min-h-[44px]"
        >
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span>{backLabel}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kartu Identitas Akun */}
        <div className="lg:col-span-5 card p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-700 text-white font-extrabold text-xl flex items-center justify-center shrink-0 overflow-hidden">
              {photo ? (
                <img
                  src={photo}
                  alt={`Foto profil ${session.name}`}
                  width="128"
                  height="128"
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <span className="badge badge-cat">{roleTitle}</span>
              <h1 className="mt-1.5 text-xl font-extrabold text-ink-900 dark:text-white truncate">
                {session.name}
              </h1>
              <p className="text-xs font-mono text-ink-600 dark:text-ink-300 truncate">
                {session.id}
              </p>
            </div>
          </div>

          <div>
            <input
              ref={fileInputRef}
              id="profile-photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              hidden
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                id="btn-photo-pick"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-sm btn-ghost w-full sm:w-auto min-h-[44px]"
              >
                {photo ? 'Ganti foto' : 'Unggah foto'}
              </button>
              {photo && (
                <button
                  id="btn-photo-remove"
                  type="button"
                  onClick={handleRemovePhoto}
                  className="btn btn-sm btn-danger-ghost w-full sm:w-auto min-h-[44px]"
                >
                  Hapus foto
                </button>
              )}
            </div>
            <p className="hint">
              JPG, PNG, atau WebP, maks. 5 MB. Foto bisa dipangkas sebelum disimpan.
            </p>
          </div>

          <dl className="divide-y divide-ink-200 dark:divide-ink-800 border-y border-ink-200 dark:border-ink-800 text-sm">
            <div className="py-3 flex items-center justify-between gap-3">
              <dt className="text-ink-600 dark:text-ink-300">{idLabel}</dt>
              <dd className="font-mono font-semibold text-ink-900 dark:text-white">
                {session.id}
              </dd>
            </div>
            {!isAdmin && (
              <div className="py-3 flex items-center justify-between gap-3">
                <dt className="text-ink-600 dark:text-ink-300">Email Google</dt>
                <dd className="font-mono text-xs font-semibold text-ink-900 dark:text-white truncate">
                  {registeredEmail}
                </dd>
              </div>
            )}
            <div className="py-3 flex items-center justify-between gap-3">
              <dt className="text-ink-600 dark:text-ink-300">Metode Masuk</dt>
              <dd className="font-semibold text-ink-900 dark:text-white">{authMethodLabel}</dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-3">
              <dt className="text-ink-600 dark:text-ink-300">Masa Aktif Sesi</dt>
              <dd className="font-semibold text-ink-900 dark:text-white">{sessionDurationLabel}</dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-3">
              <dt className="text-ink-600 dark:text-ink-300">Institusi</dt>
              <dd className="font-semibold text-ink-900 dark:text-white text-right">
                Politeknik Negeri Indramayu
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-3">
              <dt className="text-ink-600 dark:text-ink-300">Sumber Data</dt>
              <dd className="font-semibold text-ink-900 dark:text-white">
                {isLiveApi ? 'Server FastAPI Lokal' : 'Mode Demo Lokal'}
              </dd>
            </div>
          </dl>

          {/* Form Ubah Nama & Email Akun */}
          <form id="profile-name-form" onSubmit={handleSubmit} className="space-y-3">
            {errorMsg && (
              <p
                role="alert"
                className="rounded-lg border border-[var(--danger-line)] bg-[var(--danger-soft)] px-3.5 py-2.5 text-sm font-semibold text-[var(--danger-ink)]"
              >
                {errorMsg}
              </p>
            )}

            <div>
              <label htmlFor="profile-input-name" className="label">
                Nama tampilan
              </label>
              <input
                id="profile-input-name"
                type="text"
                required
                minLength={3}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                disabled={saving}
                className="field"
              />
            </div>

            {!isAdmin && (
              <div>
                <label htmlFor="profile-input-email" className="label">
                  Email Pemulihan
                </label>
                <input
                  id="profile-input-email"
                  type="email"
                  required
                  placeholder="nama@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  disabled={saving}
                  className="field"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex-1 min-h-[44px]"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              <button
                id="btn-profile-logout"
                type="button"
                onClick={handleLogout}
                className="btn btn-danger-ghost min-h-[44px]"
              >
                Keluar Akun
              </button>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Pintasan Menu */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-ink-900 dark:text-white">Pintasan</h2>
            <p className="hint">
              {isAdmin
                ? 'Ringkasan pekerjaan ada di Antrean Triase.'
                : 'Ringkasan aktivitas Anda ada di Laporan Saya.'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {isAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavigate('antrean')}
                    className="btn btn-sm btn-primary min-h-[44px]"
                  >
                    Buka Antrean Triase
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('peta')}
                    className="btn btn-sm btn-ghost min-h-[44px]"
                  >
                    Buka Peta Kampus
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavigate('lapor')}
                    className="btn btn-sm btn-primary min-h-[44px]"
                  >
                    Buat Laporan Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('laporan-saya')}
                    className="btn btn-sm btn-ghost min-h-[44px]"
                  >
                    Buka Laporan Saya
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <AvatarCropperDialog
        file={pendingCropFile}
        onConfirm={handleCropConfirm}
        onClose={() => setPendingCropFile(null)}
      />
    </section>
  );
}
