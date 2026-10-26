import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500)); // simulate async
    const ok = login(form.username, form.password);
    setLoading(false);
    if (ok) {
      navigate('/admin');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen aurora-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary-500/20 blur-3xl float-animation pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-accent-500/20 blur-3xl float-animation-delayed pointer-events-none" />

      {/* Theme toggle */}
      <button onClick={toggle} className="absolute top-6 right-6 p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary-600 to-accent-600 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <Zap size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Login</h1>
            <p className="text-white/70 text-sm mt-1">EventFlow Management Portal</p>
          </div>

          {/* Form */}
          <div className="p-8 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Username"
                icon={User}
                placeholder="Enter username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                required
                autoComplete="username"
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input-field pl-9 pr-10"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm"
                >
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                Sign In to Dashboard
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              ← <button onClick={() => navigate('/')} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">Back to Home</button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
