import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X, Sun, Moon, LogIn, LayoutDashboard, LogOut, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useScrolled } from '../../hooks';
import Button from '../ui/Button';

const navLinks = [
  { label: 'Events', href: '/#events' },
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
];

export default function Navbar() {
  const { isDark, toggle } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const scrolled = useScrolled(20);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md border-b border-slate-200/50 dark:border-slate-700/50 py-2'
          : 'bg-transparent py-4'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
            <Zap size={16} className="text-white" />
          </div>
          <span className={`font-bold text-lg ${scrolled ? 'text-slate-900 dark:text-white' : 'text-white'}`}>
            Event<span className="gradient-text">Flow</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                scrolled
                  ? 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('replay-intro'))}
            title="Play Intro Animation"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              scrolled
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 hover:bg-primary-100 dark:hover:bg-primary-900/60'
                : 'text-white bg-white/10 hover:bg-white/20 border border-white/20'
            }`}
          >
            <Sparkles size={13} className="text-amber-300" />
            <span>Intro</span>
          </button>

          <button
            onClick={toggle}
            className={`p-2 rounded-lg transition-colors ${
              scrolled
                ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated ? (
            <>
              <Button variant={scrolled ? 'secondary' : 'glass'} size="sm" icon={LayoutDashboard} onClick={() => navigate('/admin')}>
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" icon={LogOut} onClick={logout} className={scrolled ? '' : 'text-white hover:bg-white/10'}>
                Logout
              </Button>
            </>
          ) : (
            <Button variant={scrolled ? 'primary' : 'glass'} size="sm" icon={LogIn} onClick={() => navigate('/admin/login')}>
              Admin Login
            </Button>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-slate-700 dark:text-white' : 'text-white'}`}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-4 space-y-2"
          >
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-2 flex gap-2">
              <button onClick={toggle} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              {isAuthenticated ? (
                <>
                  <Button variant="secondary" size="sm" icon={LayoutDashboard} onClick={() => { navigate('/admin'); setMenuOpen(false); }}>Dashboard</Button>
                  <Button variant="ghost" size="sm" icon={LogOut} onClick={() => { logout(); setMenuOpen(false); }}>Logout</Button>
                </>
              ) : (
                <Button variant="primary" size="sm" icon={LogIn} onClick={() => { navigate('/admin/login'); setMenuOpen(false); }}>Admin Login</Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
