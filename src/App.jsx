import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Public pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegistrationPage from './pages/public/RegistrationPage';
import FeedbackPage from './pages/public/FeedbackPage';

// Admin pages
import AdminLayout from './components/layout/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import EventsPage from './pages/admin/EventsPage';
import ParticipantsPage from './pages/admin/ParticipantsPage';
import FeedbackAdminPage from './pages/admin/FeedbackAdminPage';
import SettingsPage from './pages/admin/SettingsPage';

// Shared
import NotFoundPage from './pages/NotFoundPage';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/events" element={<LandingPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/register/:eventId" element={<RegistrationPage />} />
        <Route path="/feedback/:eventId" element={<FeedbackPage />} />

        {/* Admin (protected) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/new" element={<EventsPage />} />
          <Route path="participants" element={<ParticipantsPage />} />
          <Route path="feedback" element={<FeedbackAdminPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AnimatedRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '12px',
                fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
                fontSize: '14px',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
