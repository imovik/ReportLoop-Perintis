import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { UserPortalPage } from './pages/UserPortalPage.jsx';
import { AdminPortalPage } from './pages/AdminPortalPage.jsx';
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { RegisterPage } from './pages/auth/RegisterPage.jsx';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.jsx';
import { AdminLoginPage } from './pages/auth/AdminLoginPage.jsx';
import { AdminRegisterPage } from './pages/auth/AdminRegisterPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout showChrome={false} />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/masuk" element={<LoginPage />} />
        <Route path="/daftar" element={<RegisterPage />} />
        <Route path="/lupa-password" element={<ResetPasswordPage />} />
        <Route path="/admin-masuk" element={<AdminLoginPage />} />
        <Route path="/admin-daftar" element={<AdminRegisterPage />} />
      </Route>

      <Route element={<Layout requiredRole="user" showChrome />}>
        <Route path="/user" element={<UserPortalPage />} />
      </Route>

      <Route element={<Layout requiredRole="admin" showChrome />}>
        <Route path="/admin" element={<AdminPortalPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
