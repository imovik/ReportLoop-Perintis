import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../../components/AuthShell.jsx';
import { GOOGLE_CLIENT_ID } from '../../config/constants.js';
import { loginAccount, loginWithGoogleOAuth } from '../../services/auth.js';
import { useAppStore } from '../../store/useAppStore.js';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const setSession = useAppStore((s) => s.setSession);
  const pushToast = useAppStore((s) => s.pushToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [pendingGoogleCredential, setPendingGoogleCredential] = useState('');
  const [googleInviteCode, setGoogleInviteCode] = useState('');
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const googleButtonRef = useRef(null);
  const googleOptionsRef = useRef({ rememberMe: false, inviteCode: '' });
  googleOptionsRef.current = { rememberMe, inviteCode: googleInviteCode };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;
    let cancelled = false;

    const renderGoogleBtn = () => {
      if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (cancelled || !response?.credential) return;
            setErrorMsg('');
            setGoogleSubmitting(true);
            try {
              const opts = googleOptionsRef.current;
              const session = await loginWithGoogleOAuth('admin', response.credential, {
                inviteCode: opts.inviteCode,
                rememberMe: opts.rememberMe,
              });
              setSession(session);
              pushToast(`Masuk sebagai petugas ${session.name}.`, 'success');
              navigate('/admin', { replace: true });
            } catch (err) {
              if (err?.code === 'INVITE_REQUIRED') {
                setPendingGoogleCredential(response.credential);
                setErrorMsg('Masukkan kode undangan admin Sarpras untuk menautkan akun Google.');
              } else {
                setErrorMsg(err?.message || 'Masuk Google petugas Sarpras gagal.');
              }
            } finally {
              if (!cancelled) setGoogleSubmitting(false);
            }
          },
        });
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 320,
        });
      } catch (_) {}
    };

    if (window.google?.accounts?.id) {
      renderGoogleBtn();
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', renderGoogleBtn);
      return () => {
        cancelled = true;
        existingScript.removeEventListener('load', renderGoogleBtn);
      };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', renderGoogleBtn);
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener('load', renderGoogleBtn);
    };
  }, [navigate, pushToast, setSession]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Isi email petugas dan kata sandi terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const session = await loginAccount('admin', email, password, { rememberMe });
      setSession(session);
      pushToast(`Masuk sebagai ${session.name}.`, 'success');
      navigate('/admin', { replace: true });
    } catch (err) {
      setErrorMsg(err?.message || 'Email atau kata sandi salah.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteGoogleInvite = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!googleInviteCode.trim()) {
      setErrorMsg('Isi kode undangan admin terlebih dahulu.');
      return;
    }
    setGoogleSubmitting(true);
    try {
      const session = await loginWithGoogleOAuth('admin', pendingGoogleCredential, {
        inviteCode: googleInviteCode.trim(),
        rememberMe,
      });
      setPendingGoogleCredential('');
      setSession(session);
      pushToast('Akun Google petugas Sarpras berhasil terhubung.', 'success');
      navigate('/admin', { replace: true });
    } catch (err) {
      setErrorMsg(err?.message || 'Verifikasi kode undangan gagal.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <AuthShell
      role="admin"
      title="Masuk sebagai admin Sarpras"
      subtitle="Khusus petugas yang menangani perbaikan fasilitas."
    >
      {GOOGLE_CLIENT_ID && (
        <>
          <div className="flex justify-center min-h-[44px]">
            <div ref={googleButtonRef} />
          </div>
          <div className="relative my-5 flex items-center" aria-hidden="true">
            <div className="flex-1 border-t border-[var(--line)]"></div>
            <span className="px-3 text-xs font-semibold text-[var(--ink-soft)]">atau dengan email</span>
            <div className="flex-1 border-t border-[var(--line)]"></div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="rounded-lg border border-[var(--danger-line)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--danger-ink)]"
          >
            {errorMsg}
          </div>
        )}

        <div>
          <label htmlFor="admin-login-email" className="label">
            Email
          </label>
          <input
            id="admin-login-email"
            name="identifier"
            type="email"
            autoComplete="username"
            placeholder="nama@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errorMsg && !email.trim())}
            className="field"
            disabled={submitting}
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <label htmlFor="admin-login-password" className="label mb-0">
              Kata Sandi
            </label>
            <Link
              to="/lupa-password?role=admin"
              className="text-xs font-semibold text-[var(--brand)] hover:underline"
            >
              Lupa kata sandi?
            </Link>
          </div>
          <input
            id="admin-login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errorMsg && !password)}
            className="field"
            disabled={submitting}
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <label htmlFor="admin-login-remember" className="inline-flex items-center gap-2.5 text-sm text-[var(--ink-soft)] min-h-[44px]">
            <input
              id="admin-login-remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={submitting}
              className="w-4 h-4 rounded border-[var(--line)] accent-[var(--brand)]"
            />
            <span>Ingat saya di perangkat ini</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full min-h-[44px]"
        >
          {submitting ? 'Memeriksa akun...' : 'Masuk ke panel Sarpras'}
        </button>
      </form>

      {pendingGoogleCredential && (
        <form
          onSubmit={handleCompleteGoogleInvite}
          noValidate
          className="mt-5 pt-5 border-t border-[var(--line)] space-y-3"
        >
          <p className="text-sm font-bold text-[var(--ink)]">
            Verifikasi Kode Undangan Admin
          </p>
          <div>
            <label htmlFor="google-invite-input" className="label">
              Kode Undangan Petugas
            </label>
            <input
              id="google-invite-input"
              type="text"
              placeholder="Masukkan kode undangan"
              value={googleInviteCode}
              onChange={(e) => setGoogleInviteCode(e.target.value)}
              className="field font-mono"
              disabled={googleSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={googleSubmitting}
            className="btn btn-ghost w-full min-h-[44px]"
          >
            {googleSubmitting ? 'Memverifikasi...' : 'Verifikasi Kode dan Masuk'}
          </button>
        </form>
      )}

      <div className="mt-6 pt-5 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--ink-soft)]">
        <span>Belum punya akun admin?</span>
        <Link to="/admin-daftar" className="font-bold text-[var(--brand)] hover:underline">
          Daftar dengan kode undangan
        </Link>
      </div>

      <div className="mt-6 pt-5 border-t border-[var(--line)] text-sm text-[var(--ink-soft)]">
        Mahasiswa?{' '}
        <Link to="/masuk" className="font-bold text-[var(--brand)] hover:underline">
          Masuk dengan NIM
        </Link>
      </div>
    </AuthShell>
  );
}
