import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle.jsx';
import { getProfilePhoto, getSession, logout, ROLE_HOME, ROLE_LOGIN } from '../services/auth.js';

const USER_NAV = [
  { label: 'Peta & Lapor', path: '/user', hash: '#lapor' },
  { label: 'Papan Laporan', path: '/user', hash: '#papan' },
  { label: 'Laporan Saya', path: '/user', hash: '#laporan-saya' },
];

const ADMIN_NAV = [
  { label: 'Antrean Triase', path: '/admin', hash: '#antrean' },
  { label: 'Peta Kampus', path: '/admin', hash: '#peta' },
];

function getInitials(name) {
  const parts = String(name || 'U').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AppHeader({ session, onNavigateSection, isLiveApi = false, onToggleApiMode }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const activeSession = session ?? getSession();
  const role = activeSession?.role === 'admin' ? 'admin' : 'user';
  const navItems = role === 'admin' ? ADMIN_NAV : USER_NAV;
  const homePath = ROLE_HOME[role] || '/user';
  const photoUrl = getProfilePhoto(activeSession);
  const initials = getInitials(activeSession?.name || (role === 'admin' ? 'Admin' : 'Mahasiswa'));

  useEffect(() => {
    if (!panelOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setPanelOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [panelOpen]);

  const closeAndReturnFocus = () => {
    setPanelOpen(false);
    triggerRef.current?.focus();
  };

  const handleSectionLink = (e, item) => {
    e.preventDefault();
    setPanelOpen(false);
    const sectionId = (item.hash || '').replace(/^#/, '');
    if (location.pathname === item.path && typeof onNavigateSection === 'function' && sectionId) {
      onNavigateSection(sectionId);
      return;
    }
    navigate(`${item.path}${item.hash || ''}`);
  };

  const handleBrandHome = (e) => {
    e.preventDefault();
    setPanelOpen(false);
    const targetSection = role === 'admin' ? 'antrean' : 'lapor';
    if (location.pathname === homePath && typeof onNavigateSection === 'function') {
      onNavigateSection(targetSection);
      return;
    }
    navigate(`${homePath}#${targetSection}`);
  };

  const handleProfileClick = () => {
    setPanelOpen(false);
    if (typeof onNavigateSection === 'function' && (location.pathname === '/user' || location.pathname === '/admin')) {
      onNavigateSection('profil');
      return;
    }
    navigate(`${homePath}#profil`);
  };

  const handleLogout = () => {
    setPanelOpen(false);
    logout();
    navigate(ROLE_LOGIN[role] || '/masuk', { replace: true });
  };

  const renderAvatar = (sizeClass) => (
    <span
      data-session-avatar
      className={`${sizeClass} rounded-full bg-brand-700 text-white font-extrabold flex items-center justify-center uppercase overflow-hidden shrink-0`}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );

  return (
    <header className="app-header sticky top-0 z-30 safe-top">
      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-2 sm:py-3 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <Link
            id="brand-home-link"
            to={`${homePath}#${role === 'admin' ? 'antrean' : 'lapor'}`}
            onClick={handleBrandHome}
            className="flex items-center gap-2 sm:gap-2.5 rounded-lg min-w-0 cursor-pointer"
          >
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-extrabold tracking-tight leading-none">ReportLoop</p>
              <p id="role-label" className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-blue-100 truncate">
                {role === 'admin' ? 'Admin Sarpras â€¢ Politeknik Negeri Indramayu' : 'Mahasiswa â€¢ Politeknik Negeri Indramayu'}
              </p>
            </div>
          </Link>

          <nav aria-label="Navigasi utama" className="hidden lg:block">
            <ul id="app-nav" className="flex items-center justify-center gap-1.5">
              {navItems.map((item) => {
                const currentHash = location.hash || (role === 'admin' ? '#antrean' : '#lapor');
                const isCurrent = location.pathname === item.path && currentHash === item.hash;
                return (
                  <li key={item.label}>
                    <a
                      href={`${item.path}${item.hash}`}
                      aria-current={isCurrent ? 'page' : undefined}
                      onClick={(e) => handleSectionLink(e, item)}
                      className="nav-link min-h-[44px] cursor-pointer"
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center justify-end gap-2">
            <ThemeToggle />

            <button
              ref={triggerRef}
              type="button"
              data-account-trigger
              aria-haspopup="menu"
              aria-expanded={panelOpen}
              aria-controls="account-panel"
              aria-label="Buka menu akun"
              onClick={() => setPanelOpen((prev) => !prev)}
              className="max-lg:!hidden lg:inline-flex nav-link border border-white/35 min-h-[44px] cursor-pointer"
            >
              <span
                data-session-avatar
                className="w-7 h-7 rounded-full bg-white/20 text-xs font-extrabold flex items-center justify-center uppercase overflow-hidden shrink-0"
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </span>
              <span data-session-name className="hidden xl:inline max-w-[140px] truncate">
                {activeSession?.name || (role === 'admin' ? 'Admin Sarpras' : 'Mahasiswa')}
              </span>
            </button>

            <button
              type="button"
              data-account-trigger
              aria-haspopup="menu"
              aria-expanded={panelOpen}
              aria-controls="account-panel"
              aria-label="Buka menu"
              onClick={() => setPanelOpen((prev) => !prev)}
              className="lg:!hidden nav-link border border-white/35 px-2.5 min-h-[44px] cursor-pointer"
            >
              <svg className="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            </button>
          </div>
        </div>

        {panelOpen && (
          <>
            <div
              id="account-backdrop"
              onClick={closeAndReturnFocus}
              className="fixed inset-0 z-40 bg-black/40 lg:bg-transparent"
              aria-hidden="true"
            />
            <div
              ref={panelRef}
              id="account-panel"
              role="menu"
              aria-label="Menu akun"
              className="absolute z-50 right-3 sm:right-6 lg:right-8 top-full mt-2 w-[min(22rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-[14px] border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-900 text-ink-900 dark:text-white shadow-lg"
            >
              <div className="flex items-center gap-3 p-4 border-b border-ink-200 dark:border-ink-800">
                {renderAvatar('w-12 h-12 text-base')}
                <div className="min-w-0">
                  <p data-session-name className="font-extrabold truncate">
                    {activeSession?.name || (role === 'admin' ? 'Admin Sarpras' : 'Mahasiswa')}
                  </p>
                  <p data-session-role className="text-xs text-ink-600 dark:text-ink-300 truncate">
                    {role === 'admin' ? 'Admin Sarpras' : 'Mahasiswa'}
                  </p>
                  <p data-session-id className="text-xs font-mono text-ink-600 dark:text-ink-300 truncate">
                    {activeSession?.id || '-'}
                  </p>
                </div>
              </div>

              <ul id="panel-nav" className="lg:hidden p-2 border-b border-ink-200 dark:border-ink-800" aria-label="Navigasi utama">
                {navItems.map((item) => {
                  const currentHash = location.hash || (role === 'admin' ? '#antrean' : '#lapor');
                  const isCurrent = location.pathname === item.path && currentHash === item.hash;
                  return (
                    <li key={item.label}>
                      <a
                        href={`${item.path}${item.hash}`}
                        aria-current={isCurrent ? 'page' : undefined}
                        onClick={(e) => handleSectionLink(e, item)}
                        className="menu-item min-h-[44px] cursor-pointer"
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>

              <div className="p-2">
                <button type="button" role="menuitem" onClick={handleProfileClick} className="menu-item min-h-[44px] cursor-pointer">
                  <svg className="w-5 h-5 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  <span>Profil &amp; Pengaturan Akun</span>
                </button>

                <button
                  id="btn-api-mode"
                  type="button"
                  role="menuitem"
                  aria-describedby="api-mode-hint"
                  onClick={() => {
                    if (typeof onToggleApiMode === 'function') onToggleApiMode();
                    closeAndReturnFocus();
                  }}
                  className="menu-item min-h-[44px] cursor-pointer"
                >
                  <span
                    id="api-dot"
                    aria-hidden="true"
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${isLiveApi ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  />
                  <span className="flex-1 text-left">
                    Mode data: <span id="api-mode-label">{isLiveApi ? 'API FastAPI' : 'Mode demo'}</span>
                  </span>
                </button>
                <span id="api-mode-hint" className="sr-only">
                  Tekan untuk beralih antara data demo di browser dan server FastAPI lokal.
                </span>
              </div>

              <div className="p-2 border-t border-ink-200 dark:border-ink-800">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="menu-item menu-item-danger min-h-[44px] cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
