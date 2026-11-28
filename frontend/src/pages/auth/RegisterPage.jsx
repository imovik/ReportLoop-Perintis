import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../../components/AuthShell.jsx';
import { GOOGLE_CLIENT_ID } from '../../config/constants.js';
import { loginWithGoogleOAuth, registerAccount, validateRegistration } from '../../services/auth.js';
import { useAppStore } from '../../store/useAppStore.js';

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAppStore((s) => s.setSession);
  const pushToast = useAppStore((s) => s.pushToast);

  const [form, setForm] = useState({
    name: '',
    identifier: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [gisReady, setGisReady] = useState(false);
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState('');
  const [googleNim, setGoogleNim] = useState('');
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const nameRef = useRef(null);
  const identifierRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const googleButtonRef = useRef(null);
  const googleNimRef = useRef('');
  googleNimRef.current = googleNim;

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
              setFormError('Gagal membaca kredensial akun Google.');
              return;
            }
            setFormError('');
            setGoogleSubmitting(true);
            try {
              const session = await loginWithGoogleOAuth('user', response.credential, {
                nim: googleNimRef.current,
              });
              setSession(session);
              pushToast(`Akun Google terhubung untuk ${session.name}.`, 'success');
              navigate('/user', { replace: true });
            } catch (err) {
              if (err?.code === 'NIM_REQUIRED') {
                setPendingGoogleCredential(response.credential);
                setFormError('Lengkapi NIM mahasiswa (6 sampai 12 digit) untuk menghubungkan akun Google.');
              } else {
                setFormError(err?.message || 'Daftar dengan Google gagal.');
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
          text: 'signup_with',
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

  const updateField = (key, transform) => (e) => {
    const value = transform ? transform(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    }
    if (formError) setFormError('');
  };

  const focusFirstInvalid = (errors) => {
    const order = [
      ['name', nameRef],
      ['identifier', identifierRef],
      ['email', emailRef],
      ['password', passwordRef],
      ['confirm', confirmRef],
    ];
    for (const [key, ref] of order) {
      if (errors[key] && ref.current) {
        ref.current.focus();
        break;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const errors = validateRegistration('user', { ...form, inviteCode: '' });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusFirstInvalid(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await registerAccount('user', { ...form, inviteCode: '' });
      pushToast('Akun berhasil dibuat. Silakan masuk.', 'success');
      navigate('/masuk?daftar=berhasil', { replace: true });
    } catch (err) {
      setFormError(err?.message || 'Pendaftaran gagal. Periksa kembali data Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFallbackGoogleClick = () => {
    setFieldErrors({});
    setFormError('Masuk dengan Google belum dikonfigurasi. Hubungi pengelola untuk mengisi Google Client ID.');
  };

  const handleCompleteGoogleNim = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!/^\d{6,12}$/.test(googleNim.trim())) {
      setFormError('NIM harus berupa angka, 6 sampai 12 digit.');
      return;
    }
    setGoogleSubmitting(true);
    try {
      const session = await loginWithGoogleOAuth('user', pendingGoogleCredential, {
        nim: googleNim.trim(),
      });
      setPendingGoogleCredential('');
      setSession(session);
      pushToast(`Akun Google terhubung untuk NIM ${session.id}.`, 'success');
      navigate('/user', { replace: true });
    } catch (err) {
      setFormError(err?.message || 'Gagal menautkan NIM dengan akun Google.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <AuthShell
      role="user"
      mode="register"
      title="Daftar sebagai mahasiswa"
      subtitle="Buat akun menggunakan akun Google atau formulir NIM."
      footerNote="Mode demo: akun disimpan di browser ini saja sampai backend FastAPI terhubung."
    >
      {formError && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-[var(--danger-line)] bg-[var(--danger-soft)] px-3.5 py-3 text-sm font-semibold text-[var(--danger-ink)]"
        >
          {formError}
        </p>
      )}

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
            <span>Daftar dengan Google</span>
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
            <label htmlFor="reg-google-nim" className="label">
              NIM Mahasiswa
            </label>
            <input
              id="reg-google-nim"
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
                setFormError('');
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

      <div className="relative my-5 flex items-center" aria-hidden="true">
        <div className="flex-1 border-t border-[var(--line)]" />
        <span className="px-3 text-xs font-semibold text-[var(--ink-soft)]">atau isi manual</span>
        <div className="flex-1 border-t border-[var(--line)]" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="f-name" className="label">
            Nama lengkap
          </label>
          <input
            ref={nameRef}
            id="f-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Nama sesuai KTM"
            value={form.name}
            onChange={updateField('name')}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'err-name' : undefined}
            className="field"
            disabled={submitting}
          />
          {fieldErrors.name && (
            <p id="err-name" className="error-text">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="f-identifier" className="label">
            NIM
          </label>
          <input
            ref={identifierRef}
            id="f-identifier"
            name="identifier"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={12}
            autoComplete="username"
            placeholder="Nomor induk mahasiswa"
            value={form.identifier}
            onChange={updateField('identifier', (v) => v.replace(/\D+/g, '').slice(0, 12))}
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
          <label htmlFor="f-email" className="label">
            Email Google
          </label>
          <input
            ref={emailRef}
            id="f-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@gmail.com"
            value={form.email}
            onChange={updateField('email')}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'hint-email err-email' : 'hint-email'}
            className="field"
            disabled={submitting}
          />
          <p id="hint-email" className="hint">
            Digunakan untuk pemulihan kata sandi dan tautan akun Google.
          </p>
          {fieldErrors.email && (
            <p id="err-email" className="error-text">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="f-password" className="label">
            Kata sandi
          </label>
          <div className="relative">
            <input
              ref={passwordRef}
              id="f-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={updateField('password')}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'hint-password err-password' : 'hint-password'}
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
          <p id="hint-password" className="hint">
            Minimal 8 karakter.
          </p>
          {fieldErrors.password && (
            <p id="err-password" className="error-text">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="f-confirm" className="label">
            Ulangi kata sandi
          </label>
          <input
            ref={confirmRef}
            id="f-confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={updateField('confirm')}
            aria-invalid={Boolean(fieldErrors.confirm)}
            aria-describedby={fieldErrors.confirm ? 'err-confirm' : undefined}
            className="field"
            disabled={submitting}
          />
          {fieldErrors.confirm && (
            <p id="err-confirm" className="error-text">
              {fieldErrors.confirm}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="btn btn-primary w-full min-h-[44px]"
        >
          {submitting ? 'Membuat akun...' : 'Buat akun mahasiswa'}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--ink-soft)]">
        Sudah punya akun?{' '}
        <Link
          to="/masuk"
          className="font-semibold text-[var(--brand)] underline underline-offset-2 hover:opacity-90"
        >
          Masuk
        </Link>
      </p>
    </AuthShell>
  );
}
