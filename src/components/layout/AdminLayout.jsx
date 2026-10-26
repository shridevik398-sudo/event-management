import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AdminSidebar />

      {/* Main content area — offset by sidebar width */}
      <motion.main
        className="flex-1 ml-[240px] overflow-y-auto"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="min-h-screen p-6">
          <Outlet />
        </div>
      </motion.main>

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
    </div>
  );
}
