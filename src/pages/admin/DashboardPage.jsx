import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Users, MessageSquare, Star, TrendingUp, Clock, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useAsync, useScrollReveal } from '../../hooks';
import { getDashboardStats } from '../../services/dataService';
import { StatCard, SkeletonCard } from '../../components/ui/Card';
import { formatRelative } from '../../utils/helpers';

const CHART_COLORS = ['#6172f3', '#d946ef', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

function ChartCard({ title, children }) {
  const [ref, visible] = useScrollReveal(0.05);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="glass-card bg-white dark:bg-slate-900/80 p-5"
    >
      <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-sm uppercase tracking-wider">{title}</h3>
      {children}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card bg-white dark:bg-slate-800 px-3 py-2 text-xs border border-slate-200 dark:border-slate-700">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { data: stats, loading, refetch } = useAsync(() => getDashboardStats());

  const statCards = stats ? [
    { title: 'Total Events', value: stats.totalEvents, icon: Calendar, color: 'primary' },
    { title: 'Total Participants', value: stats.totalParticipants.toLocaleString(), icon: Users, color: 'success' },
    { title: 'Upcoming Events', value: stats.upcomingEvents, icon: TrendingUp, color: 'warning' },
    { title: 'Feedback Received', value: stats.feedbackCount, icon: MessageSquare, color: 'purple' },
    { title: 'Average Rating', value: `${stats.avgRating} ★`, icon: Star, color: 'warning' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Welcome back! Here's what's happening.</p>
        </div>
        <Link to="/admin/events/new" className="btn-primary text-sm">
          + Create Event
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={1} />)
          : statCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <StatCard {...card} />
              </motion.div>
            ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registrations per event (bar) */}
        <div className="lg:col-span-2">
          <ChartCard title="Registrations per Event">
            {loading ? (
              <div className="shimmer h-48 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.registrationsPerEvent ?? []} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="registrations" fill="#6172f3" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Rating distribution (pie) */}
        <ChartCard title="Rating Distribution">
          {loading ? (
            <div className="shimmer h-48 rounded-full mx-auto w-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats?.ratingDist ?? []}
                  dataKey="count"
                  nameKey="rating"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ rating, percent }) => percent > 0.05 ? `${rating}★` : ''}
                  labelLine={false}
                >
                  {(stats?.ratingDist ?? []).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} responses`, `${n} Stars`]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Registrations over time (line) */}
      <ChartCard title="Registrations Over Time (Last 30 Days)">
        {loading ? (
          <div className="shimmer h-48 rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats?.registrationsOverTime ?? []} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(d) => d.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Registrations" stroke="#6172f3" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Recent activity */}
      <ChartCard title="Recent Registrations">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-12 rounded-xl" />)}
          </div>
        ) : stats?.recentActivity.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No activity yet. Create an event and share the registration link!</p>
        ) : (
          <div className="space-y-2">
            {stats.recentActivity.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-950 flex items-center justify-center flex-shrink-0">
                  <Users size={16} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{a.name}</p>
                  <p className="text-xs text-slate-500 truncate">registered for <span className="text-primary-600 dark:text-primary-400">{a.event}</span></p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0 flex items-center gap-1">
                  <Clock size={11} />
                  {formatRelative(a.time)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
}
