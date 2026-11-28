import { useEffect, useState } from 'react';

const THEME_KEY = 'reportloop.theme';

export function getPreferredTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch (_) {}
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  const isDark = nextTheme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.dataset.theme = nextTheme;
  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch (_) {}
}

export function ThemeToggle({ variant = 'header', className = '' }) {
  const [theme, setTheme] = useState(() => getPreferredTheme());
  const isDark = theme === 'dark';

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggle = (event) => {
    const next = isDark ? 'light' : 'dark';
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const doc = typeof document !== 'undefined' ? document : null;
    if (!doc || !doc.startViewTransition || reduceMotion) {
      setTheme(next);
      return;
    }

    const trigger = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const root = doc.documentElement;
    root.classList.add('theme-transitioning');

    const transition = doc.startViewTransition(() => {
      setTheme(next);
      applyTheme(next);
    });

    transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 650,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      })
      .catch(() => {});

    transition.finished.finally(() => {
      root.classList.remove('theme-transitioning');
    });
  };

  const buttonStyle =
    variant === 'ghost'
      ? 'btn btn-ghost px-3 min-h-[44px] cursor-pointer'
      : 'nav-link border border-white/35 px-2.5 min-h-[44px] cursor-pointer';

  return (
    <button
      type="button"
      data-theme-toggle
      onClick={handleToggle}
      aria-pressed={isDark}
      aria-label={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
      className={`${buttonStyle} ${className}`}
    >
      {isDark ? (
        <svg className="w-5 h-5 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      )}
      <span data-theme-label className="hidden xl:inline">
        {isDark ? 'Terang' : 'Gelap'}
      </span>
    </button>
  );
}
