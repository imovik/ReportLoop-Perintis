import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthShell } from '../../components/AuthShell.jsx';
import { resetAccountPassword, ROLE_LOGIN } from '../../services/auth.js';
import { useAppStore } from '../../store/useAppStore.js';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const pushToast = useAppStore((s) => s.pushToast);

  const role = searchParams.get('role') === 'admin' ? 'admin' : 'user';
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const isAdmin = role === 'admin';
  const loginHref = ROLE_LOGIN[role] || '/masuk';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessInfo(null);
    setSubmitting(true);

    try {
      const result = await resetAccountPassword(role, {
        identifier,
        email,
        newPassword,
        confirmPassword,
      });
      setSuccessInfo(result);
      setNewPassword('');
      setConfirmPassword('');
      pushToast('Kata sandi berhasil diperbarui.', 'success');
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal memulihkan kata sandi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      role={role}
      title="Pulihkan Kata Sandi"
      subtitle={
        isAdmin
          ? 'Verifikasi email petugas Sarpras yang terdaftar untuk menetapkan kata sandi baru.'
          : 'Verifikasi kombinasi NIM dan email mahasiswa yang terdaftar untuk menetapkan kata sandi baru.'
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="rounded-lg border border-[var(--danger-line)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--danger-ink)]"
          >
            {errorMsg}
          </div>
        )}

        {successInfo && (
          <div
            role="status"
            className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200 space-y-2"
          >
            <p className="font-bold">Kata sandi berhasil diperbarui.</p>
            <p className="text-xs">
              Akun <span className="font-mono font-semibold">{successInfo.id}</span> siap digunakan untuk masuk kembali.
            </p>
            <div>
              <Link to={loginHref} className="btn btn-primary btn-sm">
                Lanjut ke halaman masuk
              </Link>
            </div>
          </div>
        )}

        {isAdmin ? (
          <div>
            <label htmlFor="reset-admin-email" className="label">
              Email Admin Terdaftar
            </label>
            <input
              id="reset-admin-email"
              name="identifier"
              type="email"
              autoComplete="email"
              placeholder="admin@polindra.ac.id"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="field"
              disabled={submitting}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reset-nim" className="label">
                NIM Mahasiswa
              </label>
              <input
                id="reset-nim"
                name="identifier"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={12}
                placeholder="Nomor induk mahasiswa"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.replace(/\D+/g, '').slice(0, 12))}
                className="field font-mono"
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="reset-email" className="label">
                Email Terdaftar
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
                disabled={submitting}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reset-new-password" className="label">
              Kata Sandi Baru
            </label>
            <input
              id="reset-new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="field"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="reset-confirm-password" className="label">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              id="reset-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Ulangi kata sandi baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="field"
              disabled={submitting}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full min-h-[44px]"
        >
          {submitting ? 'Memperbarui kata sandi...' : 'Simpan Kata Sandi Baru'}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--ink-soft)]">
        <span>Sudah ingat kata sandi?</span>
        <Link to={loginHref} className="font-bold text-[var(--brand)] hover:underline">
          Kembali ke halaman masuk
        </Link>
      </div>
    </AuthShell>
  );
}
