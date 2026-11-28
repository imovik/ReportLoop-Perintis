import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader.jsx';
import { AppFooter } from './AppFooter.jsx';
import { ToastContainer } from './ToastContainer.jsx';
import { ROLE_HOME, ROLE_LOGIN } from '../services/auth.js';
import { useAppStore } from '../store/useAppStore.js';

export function Layout({ requiredRole = null, showChrome = true, onNavigateSection }) {
  const location = useLocation();
  const session = useAppStore((s) => s.session);
  const refreshSession = useAppStore((s) => s.refreshSession);
  const setSession = useAppStore((s) => s.setSession);
  const isLiveApi = useAppStore((s) => s.isLiveApi);
  const setIsLiveApi = useAppStore((s) => s.setIsLiveApi);
  const loadReports = useAppStore((s) => s.loadReports);

  useEffect(() => {
    refreshSession();
  }, [location.pathname, location.search, refreshSession]);

  useEffect(() => {
    loadReports({ silent: true });
  }, [loadReports]);

  if (requiredRole) {
    if (!session || session.role !== requiredRole) {
      const target = session ? ROLE_HOME[session.role] || '/' : ROLE_LOGIN[requiredRole] || '/masuk';
      return <Navigate to={target} replace state={{ from: location.pathname }} />;
    }
  }

  const handleToggleApiMode = () => {
    if (typeof setIsLiveApi === 'function') {
      setIsLiveApi(!isLiveApi);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--page)] text-[var(--ink)]">
      {showChrome && (
        <AppHeader
          session={session}
          onNavigateSection={onNavigateSection}
          isLiveApi={isLiveApi}
          onToggleApiMode={handleToggleApiMode}
        />
      )}
      <div className="flex-1">
        <Outlet context={{ session, setSession }} />
      </div>
      {showChrome && <AppFooter />}
      <ToastContainer />
    </div>
  );
}
