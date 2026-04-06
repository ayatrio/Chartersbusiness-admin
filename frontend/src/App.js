import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import DashboardPage   from './pages/DashboardPage';
import LinkedInPage    from './pages/LinkedInPage';
import GitHubPage      from './pages/GitHubPage';
import YouTubePage     from './pages/YouTubePage';
import WebsitePage     from './pages/WebsitePage';
import CredentialsPage from './pages/CredentialsPage';
import NetworkingPage  from './pages/NetworkingPage';
import AIToolsPage     from './pages/AIToolsPage';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" replace />;
};

const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: 'var(--bg-primary)'
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      border: '3px solid #eadfd6',
      borderTopColor: 'var(--accent)',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login"    element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />

      <Route path="/dashboard"   element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/linkedin"    element={<ProtectedRoute><LinkedInPage /></ProtectedRoute>} />
      <Route path="/github"      element={<ProtectedRoute><GitHubPage /></ProtectedRoute>} />
      <Route path="/youtube"     element={<ProtectedRoute><YouTubePage /></ProtectedRoute>} />
      <Route path="/website"     element={<ProtectedRoute><WebsitePage /></ProtectedRoute>} />
      <Route path="/credentials" element={<ProtectedRoute><CredentialsPage /></ProtectedRoute>} />
      <Route path="/networking"  element={<ProtectedRoute><NetworkingPage /></ProtectedRoute>} />
      <Route path="/ai-tools"    element={<ProtectedRoute><AIToolsPage /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(255,255,255,0.96)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              borderRadius: '14px'
            },
            success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--bg-card)' } },
            error:   { iconTheme: { primary: 'var(--red)',   secondary: 'var(--bg-card)' } }
          }}
        />
      </Router>
    </AuthProvider>
  );
}

