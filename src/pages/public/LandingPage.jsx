import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Calendar, Users, Star, Zap, BarChart3, Shield, Globe, CheckCircle, ArrowRight, Download, Upload, LayoutDashboard, Sparkles } from 'lucide-react';
import IntroAnimation from '../../components/ui/IntroAnimation';
import Navbar from '../../components/layout/Navbar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { StatCard } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { useAsync, useScrollReveal, useCounter } from '../../hooks';
import { getEvents } from '../../services/dataService';
import { formatDate, getBannerGradient, isUpcoming } from '../../utils/helpers';
import { Toaster } from 'react-hot-toast';

/* ── Animated section wrapper ─────────────────────────── */
function RevealSection({ children, delay = 0, className = '' }) {
  const [ref, visible] = useScrollReveal(0.1);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Stat counter ─────────────────────────────────────── */
function AnimatedStat({ value, label, suffix = '' }) {
  const [ref, visible] = useScrollReveal(0.1);
  const count = useCounter(value, 2000, visible);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold gradient-text">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-slate-400 mt-2 text-sm font-medium">{label}</div>
    </div>
  );
}

/* ── Features list ───────────────────────────────────── */
const features = [
  { icon: Calendar, title: 'Event Management', desc: 'Create, edit, and manage events with ease. Supports all categories, capacity controls, and custom fields.', color: 'bg-blue-500' },
  { icon: Users, title: 'Participant Tracking', desc: 'Register participants, manage attendance, and handle bulk uploads of 10,000+ rows with a Web Worker.', color: 'bg-emerald-500' },
  { icon: Star, title: 'Feedback & Ratings', desc: 'Collect star ratings, comments, and suggestions. Analyze responses with beautiful breakdown charts.', color: 'bg-amber-500' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Real-time charts for registrations over time, per-event breakdowns, and rating distributions.', color: 'bg-purple-500' },
  { icon: Download, title: 'Export Everything', desc: 'Export events, participants, and feedback to Excel or CSV. Import from any spreadsheet with validation.', color: 'bg-cyan-500' },
  { icon: Shield, title: 'Secure Admin Panel', desc: 'Separate admin area with login protection, custom form builders, and full CRUD on all data.', color: 'bg-rose-500' },
];

/* ── How it works steps ─────────────────────────────── */
const steps = [
  { num: '01', title: 'Create an Event', desc: 'Fill in event details, set capacity, add custom registration fields, and publish with one click.' },
  { num: '02', title: 'Share the Link', desc: 'Each event gets a unique public registration URL that you can share anywhere — email, WhatsApp, social.' },
  { num: '03', title: 'Manage Registrations', desc: 'View all participants in a fast, searchable table. Check in attendees on the day of the event.' },
  { num: '04', title: 'Collect Feedback', desc: 'Send the feedback link after the event. Get star ratings and comments, then export results.' },
];

/* ── Event card ─────────────────────────────────────── */
function EventCard({ event }) {
  const navigate = useNavigate();
  const gradient = getBannerGradient(event);
  const spotsLeft = event.capacity > 0 ? event.capacity - (event.registrations ?? 0) : null;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      className="glass-card bg-white dark:bg-slate-900/80 overflow-hidden cursor-pointer group"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      {/* Banner */}
      <div className={`h-40 ${gradient} relative flex items-center justify-center`}>
        <span className="text-5xl">{event.emoji ?? '📅'}</span>
        <div className="absolute top-3 left-3">
          <StatusBadge status={event.status} />
        </div>
        {spotsLeft !== null && spotsLeft <= 20 && spotsLeft > 0 && (
          <div className="absolute top-3 right-3">
            <span className="badge badge-warning">Only {spotsLeft} left!</span>
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Category */}
        <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
          {event.category}
        </span>

        {/* Title */}
        <h3 className="font-bold text-slate-900 dark:text-white mt-1 text-lg leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
          {event.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
          {event.description}
        </p>

        {/* Meta */}
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(event.date, 'MMM d, yyyy')}</span>
          <span className="flex items-center gap-1"><Users size={12} />{event.registrations ?? 0} registered</span>
        </div>

        {/* CTA */}
        <button
          className="mt-4 w-full btn-primary text-sm"
          onClick={(e) => { e.stopPropagation(); navigate(`/register/${event.id}`); }}
          disabled={event.status !== 'open'}
        >
          {event.status === 'open' ? 'Register Now' : event.status === 'closed' ? 'Registration Closed' : 'Coming Soon'}
          {event.status === 'open' && <ArrowRight size={14} />}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main Landing Page ──────────────────────────────── */
export default function LandingPage() {
  const { data: events, loading } = useAsync(() => getEvents());
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('ef_intro_seen'));

  useEffect(() => {
    const handleReplay = () => setShowIntro(true);
    window.addEventListener('replay-intro', handleReplay);
    return () => window.removeEventListener('replay-intro', handleReplay);
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem('ef_intro_seen', 'true');
    setShowIntro(false);
  };

  const upcomingEvents = events?.filter((e) => e.status === 'open') ?? [];

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      </AnimatePresence>

      <Navbar />
      <Toaster position="top-right" />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen aurora-bg flex items-center overflow-hidden">
        {/* Gradient mesh overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40" />

        {/* Floating decorative blobs */}
        <motion.div style={{ y: heroY }}
          className="absolute inset-0 pointer-events-none">
          <div className="float-animation absolute top-20 left-10 w-64 h-64 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="float-animation-delayed absolute top-40 right-20 w-80 h-80 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="float-animation absolute bottom-20 left-1/3 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl" />
        </motion.div>

        {/* Floating card decorations */}
        <motion.div
          animate={{ y: [-10, 10, -10], rotate: [2, -2, 2] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-16 top-32 hidden lg:block glass-card bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <CheckCircle size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Registration Confirmed!</div>
              <div className="text-white/70 text-xs">ID: EF-ABC123XY</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [8, -8, 8], rotate: [-1, 1, -1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute left-12 bottom-32 hidden lg:block glass-card bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20"
        >
          <div className="flex items-center gap-2 text-white">
            <Users size={16} className="text-cyan-300" />
            <span className="text-sm font-medium">+1,200 registrations today</span>
          </div>
        </motion.div>

        {/* Hero content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              onClick={() => setShowIntro(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6 transition-all hover:scale-105 active:scale-95 group cursor-pointer shadow-lg shadow-black/10"
            >
              <Zap size={14} className="text-amber-300 animate-pulse" />
              <span>The #1 College Event Management Platform</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                <Sparkles size={11} /> Watch Intro
              </span>
            </button>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
              Manage Events{' '}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-300 to-cyan-300">
                Like Never Before
              </span>
            </h1>

            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              From creation to feedback — EventFlow handles every step of your event lifecycle. Beautiful, fast, and built for scale.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="glass"
                size="xl"
                icon={Calendar}
                onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Browse Events
              </Button>
              <Button
                size="xl"
                className="bg-white text-slate-900 hover:bg-slate-100"
                icon={LayoutDashboard}
                onClick={() => navigate('/admin/login')}
              >
                Admin Panel
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L1440 80L1440 20C1200 70 960 90 720 60C480 30 240 50 0 20L0 80Z" className="fill-slate-50 dark:fill-slate-950"/>
          </svg>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <RevealSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <AnimatedStat value={events?.length ?? 5} label="Events Created" />
              <AnimatedStat value={events?.reduce((s, e) => s + (e.registrations ?? 0), 0) ?? 50} label="Participants Registered" />
              <AnimatedStat value={98} label="Satisfaction Rate" suffix="%" />
              <AnimatedStat value={30} label="Days of Activity" suffix="+" />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── UPCOMING EVENTS ───────────────────────────────── */}
      <section id="events" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <RevealSection>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white">
                Upcoming <span className="gradient-text">Events</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg">Register for an event in seconds</p>
            </div>
          </RevealSection>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card p-5 space-y-3">
                  <div className="shimmer h-40 rounded-xl" />
                  <div className="shimmer h-5 rounded w-3/4" />
                  <div className="shimmer h-4 rounded w-full" />
                  <div className="shimmer h-4 rounded w-5/6" />
                  <div className="shimmer h-10 rounded-xl" />
                </div>
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event, i) => (
                <RevealSection key={event.id} delay={i * 0.1}>
                  <EventCard event={event} />
                </RevealSection>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Calendar size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No upcoming events right now. Check back soon!</p>
            </div>
          )}

          {events && events.length > 0 && (
            <RevealSection className="text-center mt-10">
              <Button variant="secondary" size="lg" onClick={() => navigate('/events')} iconRight={ArrowRight}>
                View All Events
              </Button>
            </RevealSection>
          )}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="features" className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <RevealSection>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white">
                Everything You <span className="gradient-text">Need</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg">A complete toolkit for modern event management</p>
            </div>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <RevealSection key={f.title} delay={i * 0.08}>
                <Card hover className="h-full">
                  <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-4`}>
                    <f.icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </Card>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <RevealSection>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white">
                How It <span className="gradient-text">Works</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg">Up and running in minutes</p>
            </div>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden lg:block absolute top-10 left-1/8 right-1/8 h-0.5 bg-gradient-to-r from-primary-300 to-accent-300 opacity-50" style={{ top: '2.5rem', left: '12.5%', right: '12.5%' }} />

            {steps.map((step, i) => (
              <RevealSection key={step.num} delay={i * 0.12}>
                <div className="text-center relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <span className="text-white font-bold text-lg">{step.num}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-20 aurora-bg relative">
        <div className="absolute inset-0 bg-black/30" />
        <RevealSection className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">Ready to get started?</h2>
          <p className="text-white/80 text-lg mb-8">Login to the admin panel and create your first event in under 2 minutes.</p>
          <Button size="xl" className="bg-white text-slate-900 hover:bg-slate-100" icon={Zap} onClick={() => navigate('/admin/login')}>
            Go to Admin Panel
          </Button>
        </RevealSection>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg">EventFlow</span>
            </div>
            <p className="text-sm text-center">© {new Date().getFullYear()} EventFlow. All data stored locally in your browser.</p>
            <div className="flex items-center gap-4 text-sm">
              <button onClick={() => navigate('/admin/login')} className="hover:text-white transition-colors">Admin</button>
              <button onClick={() => navigate('/events')} className="hover:text-white transition-colors">Events</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
