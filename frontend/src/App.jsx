import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Landing from './views/Landing.jsx';
import Register from './views/Register.jsx';
import Dashboard from './views/Dashboard.jsx';
import Interview from './views/Interview.jsx';
import Profile from './views/Profile.jsx';
import OnboardingModal from './components/OnboardingModal.jsx';
import ParticleCanvas from './components/ParticleCanvas.jsx';

const ONBOARDING_SKIP_KEY = 'reviewer_ai_onboarding_skipped';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function OnboardingGate({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [skipped, setSkipped] = useState(() => !!sessionStorage.getItem(ONBOARDING_SKIP_KEY));

  useEffect(() => {
    function handleSkip() {
      sessionStorage.setItem(ONBOARDING_SKIP_KEY, 'true');
      setSkipped(true);
    }
    window.addEventListener('onboarding-skipped', handleSkip);
    return () => window.removeEventListener('onboarding-skipped', handleSkip);
  }, []);

  const needsOnboarding =
    isAuthenticated &&
    !skipped &&
    Array.isArray(user?.tech_stack) &&
    user.tech_stack.length === 0;

  return (
    <>
      {children}
      {needsOnboarding && <OnboardingModal />}
    </>
  );
}

function AppRoutes() {
  return (
    <OnboardingGate>
      <Routes>
        <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </OnboardingGate>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ParticleCanvas />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
