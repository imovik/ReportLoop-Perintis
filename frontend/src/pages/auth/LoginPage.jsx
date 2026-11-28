import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from '../../components/AuthShell.jsx';
import { GOOGLE_CLIENT_ID } from '../../config/constants.js';
import { loginAccount, loginWithGoogleOAuth } from '../../services/auth.js';
import { useAppStore } from '../../store/useAppStore.js';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAppStore((s) => s.setSession);
  const pushToast = useAppStore((s) => s.pushToast);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [noticeMsg, setNoticeMsg] = useState(() =>
    searchParams.get('daftar') === 'berhasil' ? 'Akun berhasil dibuat. Silakan masuk.' : ''
  );

  const [gisReady, setGisReady] = useState(false);
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState('');
  const [googleNim, setGoogleNim] = useState('');
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const nimInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const googleButtonRef = useRef(null);
  const googleOptionsRef = useRef({ rememberMe: false, nim: '' });
  googleOptionsRef.current = { rememberMe, nim: googleNim };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;
    let cancelled = false;

    const renderGoogleBtn = () => {
      if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (cancelled || !response?.credential) {
              setErrorMsg('Gagal membaca kredensial akun Google.');
              return;
            }
            setErrorMsg('');
            setNoticeMsg('');
            setGoogleSubmitting(true);
            try {
              const opts = googleOptionsRef.current;
              const session = await loginWithGoogleOAuth('user', response.credential, {
                nim: opts.nim,
                rememberMe: opts.rememberMe,
              });
              setSession(session);
              pushToast(`Selamat datang kembali, ${session.name}.`, 'success');
              navigate('/user', { replace: true });
            } catch (err) {
              if (err?.code === 'NIM_REQUIRED') {
                setPendingGoogleCredential(response.credential);
                setErrorMsg('Lengkapi NIM mahasiswa (6 sampai 12 digit) untuk menautkan akun Google.');
              } else {
                setErrorMsg(err?.message || 'Masuk dengan Google gagal.');
              }
            } finally {
              if (!cancelled) setGoogleSubmitting(false);
            }
          },
        });

        const containerWidth = googleButtonRef.current.parentElement?.clientWidth || 340;
        const buttonWidth = Math.min(384, Math.max(240, containerWidth));

        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: buttonWidth,
        });
        setGisReady(true);
      } catch (_) {
        setGisReady(false);
      }
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

  const clearErrors = () => {
    setFieldErrors({});
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    setNoticeMsg('');

    const errors = {};
    const idVal = identifier.trim();
    if (!idVal) {
      errors.identifier = 'Isi NIM Anda.';
    } else if (!/^\d{6,12}$/.test(idVal)) {
      errors.identifier = 'NIM harus berupa angka, 6 sampai 12 digit.';
    }
    if (!password) {
      errors.password = 'Isi kata sandi.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.identifier) nimInputRef.current?.focus();
      else if (errors.password) passwordInputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const session = await loginAccount('user', identifier, password, { rememberMe });
      setSession(session);
      pushToast(`Masuk sebagai ${session.name}.`, 'success');
      navigate('/user', { replace: true });
    } catch (err) {
      setErrorMsg(err?.message || 'NIM atau kata sandi salah.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFallbackGoogleClick = () => {
    clearErrors();
    setNoticeMsg('');
    setErrorMsg('Masuk dengan Google belum dikonfigurasi. Hubungi pengelola untuk mengisi Google Client ID.');
  };

  const handleCompleteGoogleNim = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!/^\d{6,12}$/.test(googleNim.trim())) {
      setErrorMsg('NIM harus berupa angka, 6 sampai 12 digit.');
      return;
    }
    setGoogleSubmitting(true);
    try {
      const session = await loginWithGoogleOAuth('user', pendingGoogleCredential, {
        nim: googleNim.trim(),
        rememberMe,
      });
      setPendingGoogleCredential('');
      setSession(session);
      pushToast(`Akun Google terhubung untuk NIM ${session.id}.`, 'success');
      navigate('/user', { replace: true });
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal menautkan NIM dengan akun Google.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <AuthShell
      role="user"
      mode="login"
      title="Masuk sebagai mahasiswa"
      subtitle="Gunakan NIM dan kata sandi, atau masuk dengan akun Google."
      footerNote="Mode demo: akun disimpan di browser ini saja sampai backend FastAPI terhubung."
    >
      {noticeMsg && (
        <p
          role="status"
          className="mb-5 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/70 px-3.5 py-3 text-sm font-semibold text-green-900 dark:text-green-200"
        >
          {noticeMsg}
        </p>
      )}

      {errorMsg && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-[var(--danger-line)] bg-[var(--danger-soft)] px-3.5 py-3 text-sm font-semibold text-[var(--danger-ink)]"
        >
          {errorMsg}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="f-identifier" className="label">
            NIM
          </label>
          <input
            ref={nimInputRef}
            id="f-identifier"
            name="identifier"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={12}
            autoComplete="username"
            placeholder="Nomor induk mahasiswa"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value.replace(/\D+/g, '').slice(0, 12));
              if (fieldErrors.identifier) setFieldErrors((prev) => ({ ...prev, identifier: '' }));
            }}
            aria-invalid={Boolean(fieldErrors.identifier)}
            aria-describedby={fieldErrors.identifier ? 'err-identifier' : undefined}
            className="field font-mono"
            disabled={submitting}
          />
          {fieldErrors.identifier && (
            <p id="err-identifier" className="error-text">
              {fieldErrors.identifier}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="f-password" className="label">
            Kata sandi
          </label>
          <div className="relative">
            <input
              ref={passwordInputRef}
              id="f-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
              }}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'err-password' : undefined}
              className="field pr-28"
              disabled={submitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-pressed={showPassword}
              className="absolute right-1 top-1 bottom-1 px-3 rounded-md text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)]"
            >
              {showPassword ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </div>
          <div className="mt-1 flex items-center justify-end">
            <Link
              to="/lupa-password?role=user"
              className="inline-flex items-center min-h-[44px] px-1 text-xs font-semibold text-[var(--brand)] underline underline-offset-2 hover:opacity-90"
            >
              Lupa kata sandi?
            </Link>
          </div>
          {fieldErrors.password && (
            <p id="err-password" className="error-text">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <label
          htmlFor="f-remember"
          className="flex items-center gap-2.5 min-h-[44px] text-sm text-[var(--ink-soft)] select-none"
        >
          <input
            id="f-remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={submitting}
            className="w-4 h-4 rounded border-[var(--line)] accent-[var(--brand)]"
          />
          <span>Ingat saya di perangkat ini</span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="btn btn-primary w-full min-h-[44px]"
        >
          {submitting ? 'Memeriksa akun...' : 'Masuk ke ReportLoop'}
        </button>
      </form>

      <div className="relative my-5 flex items-center" aria-hidden="true">
        <div className="flex-1 border-t border-[var(--line)]" />
        <span className="px-3 text-xs font-semibold text-[var(--ink-soft)]">atau masuk dengan</span>
        <div className="flex-1 border-t border-[var(--line)]" />
      </div>

      <div>
        {!gisReady && (
          <button
            type="button"
            onClick={handleFallbackGoogleClick}
            disabled={googleSubmitting}
            className="btn w-full min-h-[44px] bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--brand-soft)]"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </button>
        )}
        <div
          ref={googleButtonRef}
          className={gisReady ? 'flex justify-center min-h-[44px] overflow-hidden' : 'hidden'}
        />
      </div>

      {pendingGoogleCredential && (
        <form
          onSubmit={handleCompleteGoogleNim}
          noValidate
          className="mt-5 pt-5 border-t border-[var(--line)] space-y-3"
        >
          <p className="text-sm font-bold text-[var(--ink)]">Lengkapi verifikasi akun Google</p>
          <p className="text-xs text-[var(--ink-soft)]">
            Akun Google ini belum terdaftar. Masukkan NIM Anda untuk menghubungkan akun Google.
          </p>
          <div>
            <label htmlFor="google-nim-input" className="label">
              NIM Mahasiswa
            </label>
            <input
              id="google-nim-input"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={12}
              placeholder="Nomor induk mahasiswa"
              value={googleNim}
              onChange={(e) => setGoogleNim(e.target.value.replace(/\D+/g, '').slice(0, 12))}
              className="field font-mono"
              disabled={googleSubmitting}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setPendingGoogleCredential('');
                setGoogleNim('');
                setErrorMsg('');
              }}
              disabled={googleSubmitting}
              className="btn btn-ghost min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={googleSubmitting}
              className="btn btn-primary min-h-[44px]"
            >
              {googleSubmitting ? 'Menghubungkan...' : 'Lanjutkan Masuk'}
            </button>
          </div>
        </form>
      )}

      <p className="mt-6 text-sm text-[var(--ink-soft)]">
        Belum punya akun?{' '}
        <Link
          to="/daftar"
          className="font-semibold text-[var(--brand)] underline underline-offset-2 hover:opacity-90"
        >
          Daftar dengan NIM
        </Link>
      </p>
    </AuthShell>
  );
}
