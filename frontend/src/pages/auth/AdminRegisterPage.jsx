import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../../components/AuthShell.jsx';
import { registerAccount, validateRegistration } from '../../services/auth.js';
import { useAppStore } from '../../store/useAppStore.js';

export function AdminRegisterPage() {
  const navigate = useNavigate();
  const pushToast = useAppStore((s) => s.pushToast);

  const [form, setForm] = useState({
    name: '',
    identifier: '',
    password: '',
    confirm: '',
    inviteCode: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    }
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const errors = validateRegistration('admin', { ...form, email: form.identifier });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await registerAccount('admin', { ...form, email: form.identifier });
      pushToast('Akun petugas Sarpras berhasil didaftarkan. Silakan masuk.', 'success');
      navigate('/admin-masuk', { replace: true });
    } catch (err) {
      setFormError(err?.message || 'Pendaftaran petugas gagal. Periksa kembali kode undangan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      role="admin"
      title="Daftar Akun Admin Sarpras"
      subtitle="Pendaftaran petugas Sarpras memerlukan kode undangan resmi dan email valid."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-[var(--danger-line)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--danger-ink)]"
          >
            {formError}
          </div>
        )}

        <div>
          <label htmlFor="admin-reg-name" className="label">
            Nama Lengkap Petugas
          </label>
          <input
            id="admin-reg-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Masukkan nama lengkap"
            value={form.name}
            onChange={updateField('name')}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'admin-reg-name-error' : undefined}
            className="field"
            disabled={submitting}
          />
          {fieldErrors.name && (
            <p id="admin-reg-name-error" className="error-text">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="admin-reg-email" className="label">
              Email Petugas
            </label>
            <input
              id="admin-reg-email"
              name="identifier"
              type="email"
              autoComplete="email"
              placeholder="petugas@polindra.ac.id"
              value={form.identifier}
              onChange={updateField('identifier')}
              aria-invalid={Boolean(fieldErrors.identifier)}
              aria-describedby={fieldErrors.identifier ? 'admin-reg-email-error' : undefined}
              className="field"
              disabled={submitting}
            />
            {fieldErrors.identifier && (
              <p id="admin-reg-email-error" className="error-text">
                {fieldErrors.identifier}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="admin-reg-invite" className="label">
              Kode Undangan Admin
            </label>
            <input
              id="admin-reg-invite"
              name="inviteCode"
              type="text"
              placeholder="Masukkan kode undangan"
              value={form.inviteCode}
              onChange={updateField('inviteCode')}
              aria-invalid={Boolean(fieldErrors.inviteCode)}
              aria-describedby={fieldErrors.inviteCode ? 'admin-reg-invite-error' : undefined}
              className="field font-mono"
              disabled={submitting}
            />
            {fieldErrors.inviteCode && (
              <p id="admin-reg-invite-error" className="error-text">
                {fieldErrors.inviteCode}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="admin-reg-password" className="label">
              Kata Sandi
            </label>
            <input
              id="admin-reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              value={form.password}
              onChange={updateField('password')}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'admin-reg-password-error' : undefined}
              className="field"
              disabled={submitting}
            />
            {fieldErrors.password && (
              <p id="admin-reg-password-error" className="error-text">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="admin-reg-confirm" className="label">
              Konfirmasi Kata Sandi
            </label>
            <input
              id="admin-reg-confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Ulangi kata sandi"
              value={form.confirm}
              onChange={updateField('confirm')}
              aria-invalid={Boolean(fieldErrors.confirm)}
              aria-describedby={fieldErrors.confirm ? 'admin-reg-confirm-error' : undefined}
              className="field"
              disabled={submitting}
            />
            {fieldErrors.confirm && (
              <p id="admin-reg-confirm-error" className="error-text">
                {fieldErrors.confirm}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full min-h-[44px]"
        >
          {submitting ? 'Memverifikasi kode...' : 'Daftar Akun Admin Sarpras'}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--ink-soft)]">
        <span>Sudah memiliki akun petugas?</span>
        <Link to="/admin-masuk" className="font-bold text-[var(--brand)] hover:underline">
          Masuk admin di sini
        </Link>
      </div>
    </AuthShell>
  );
}
