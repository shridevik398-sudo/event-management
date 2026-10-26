import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, ChevronRight } from 'lucide-react';

const STATUS_MESSAGES = [
  'Initializing Campus Event Matrix...',
  'Connecting Real-Time Sockets...',
  'Calibrating Glassmorphic Shaders...',
  'Welcome to EventFlow 2025 ✦',
];

export default function IntroAnimation({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2400; // 2.4 seconds intro

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const current = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(current);

      if (current < 30) setStatusIdx(0);
      else if (current < 65) setStatusIdx(1);
      else if (current < 90) setStatusIdx(2);
      else setStatusIdx(3);

      if (current >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          onComplete();
        }, 350);
      }
    }, 25);

    // Keyboard 'Esc' to skip
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        clearInterval(timer);
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  const letters = 'EVENTFLOW'.split('');

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.08,
        filter: 'blur(16px)',
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
      }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#090b14] overflow-hidden select-none cursor-pointer"
      onClick={onComplete}
    >
      {/* Dynamic Aurora & Grid Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-primary-600/25 via-accent-500/20 to-cyan-500/25 blur-[120px] animate-pulse" />
        
        {/* Subtle cyber grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)`,
            backgroundSize: '36px 36px',
          }}
        />

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/40"
            style={{
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              top: `${(i * 19) % 95}%`,
              left: `${(i * 27) % 95}%`,
            }}
            animate={{
              y: [-15, 15, -15],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.15,
            }}
          />
        ))}
      </div>

      {/* Skip Button */}
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        className="absolute top-6 right-6 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all flex items-center gap-1.5 group"
      >
        <span>Skip</span>
        <span className="text-[10px] text-white/40 px-1 py-0.5 rounded bg-white/10">Esc</span>
        <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
      </motion.button>

      {/* Main Center Content */}
      <div className="relative z-10 flex flex-col items-center px-4 max-w-md w-full">
        {/* Glowing Logo Icon */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Rotating outer ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute w-24 h-24 rounded-full border border-dashed border-cyan-400/30"
          />

          {/* Pulsing glow ring */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-20 h-20 rounded-full bg-gradient-to-r from-primary-500/40 via-cyan-400/40 to-accent-500/40 blur-md"
          />

          {/* Central Logo Emblem */}
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 120 }}
            className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-indigo-600 to-accent-500 p-[1px] shadow-2xl shadow-primary-500/50"
          >
            <div className="w-full h-full rounded-2xl bg-slate-950/80 backdrop-blur-xl flex items-center justify-center">
              <Zap size={30} className="text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
            </div>
          </motion.div>
        </div>

        {/* Animated Brand Headline */}
        <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
          {letters.map((char, index) => (
            <motion.span
              key={index}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.15 + index * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-3xl sm:text-4xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-200"
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Subtitle tag */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase mb-8"
        >
          <Sparkles size={12} className="text-amber-300 animate-spin-slow" />
          <span>Next-Gen Campus Experiences</span>
          <Sparkles size={12} className="text-amber-300 animate-spin-slow" />
        </motion.div>

        {/* Equalizer Wave Bars */}
        <div className="flex items-end gap-1.5 h-6 mb-6">
          {[40, 75, 100, 60, 85, 45, 90, 70].map((h, i) => (
            <motion.div
              key={i}
              animate={{
                height: [`${h * 0.3}%`, `${h}%`, `${h * 0.4}%`],
              }}
              transition={{
                duration: 0.8 + (i % 4) * 0.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.1,
              }}
              className="w-1 rounded-full bg-gradient-to-t from-primary-500 to-cyan-400"
            />
          ))}
        </div>

        {/* Progress Bar Container */}
        <div className="w-full max-w-xs space-y-2">
          <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-primary-500 to-accent-400 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.7)]"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>

          {/* Progress Details */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <motion.span
              key={statusIdx}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="truncate pr-2 text-slate-300"
            >
              {STATUS_MESSAGES[statusIdx]}
            </motion.span>
            <span className="text-cyan-400 font-semibold">{progress}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
