import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Star, Search, Download, Filter, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useAsync, useDebounce } from '../../hooks';
import { getFeedback, getEvents } from '../../services/dataService';
import { exportToExcel, exportToCSV, formatFeedbackForExport } from '../../utils/exportUtils';
import { formatRelative } from '../../utils/helpers';
import StarRating from '../../components/ui/StarRating';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Card';
import toast from 'react-hot-toast';

const RATING_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981'];

export default function FeedbackPage() {
  const { data: feedback, loading: fLoading } = useAsync(() => getFeedback());
  const { data: events } = useAsync(() => getEvents());

  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const debouncedSearch = useDebounce(search, 300);

  const filtered = (feedback ?? []).filter((f) => {
    const matchSearch = !debouncedSearch ||
      f.participantName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      f.liked?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      f.suggestions?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchEvent = eventFilter === 'all' || f.eventId === eventFilter;
    const matchRating = ratingFilter === 'all' || f.rating === parseInt(ratingFilter, 10);
    return matchSearch && matchEvent && matchRating;
  }).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const avgRating = filtered.length
    ? (filtered.reduce((s, f) => s + (f.rating ?? 0), 0) / filtered.length).toFixed(1)
    : 0;

  const ratingDist = [1, 2, 3, 4, 5].map((r) => ({
    rating: `${r}★`,
    count: filtered.filter((f) => f.rating === r).length,
    color: RATING_COLORS[r - 1],
  }));

  const getEventName = (eventId) => events?.find((e) => e.id === eventId)?.title ?? eventId;

  const handleExportExcel = () => {
    exportToExcel(formatFeedbackForExport(filtered, events ?? []), 'feedback.xlsx', 'Feedback');
    toast.success('Exported to Excel');
  };

  const handleExportCSV = () => {
    exportToCSV(formatFeedbackForExport(filtered, events ?? []), 'feedback.csv');
    toast.success('Exported to CSV');
  };

  if (fLoading) return (
    <div className="space-y-4">
      <SkeletonCard lines={1} />
      <SkeletonCard lines={8} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Feedback</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {filtered.length} response{filtered.length !== 1 ? 's' : ''} · Average rating: <strong>{avgRating} ★</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={Download} onClick={handleExportExcel}>Excel</Button>
          <Button variant="ghost" size="sm" icon={Download} onClick={handleExportCSV}>CSV</Button>
        </div>
      </div>

      {/* Stats + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary stats */}
        <div className="glass-card bg-white dark:bg-slate-900/80 p-5 space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider">Summary</h3>
          <div className="text-center py-4">
            <div className="text-5xl font-extrabold gradient-text">{avgRating}</div>
            <div className="mt-2">
              <StarRating value={Math.round(parseFloat(avgRating))} readOnly size="md" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">out of 5 ({filtered.length} responses)</p>
          </div>
          <div className="space-y-2">
            {ratingDist.reverse().map((r) => (
              <div key={r.rating} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-slate-600 dark:text-slate-400 text-right text-xs">{r.rating}</span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: filtered.length > 0 ? `${(r.count / filtered.length) * 100}%` : '0%',
                      backgroundColor: r.color,
                    }}
                  />
                </div>
                <span className="w-6 text-xs text-slate-500">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="lg:col-span-2 glass-card bg-white dark:bg-slate-900/80 p-5">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider mb-4">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[...ratingDist].reverse()} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <XAxis dataKey="rating" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip formatter={(v) => [`${v} responses`]} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {[...ratingDist].reverse().map((r, i) => (
                  <Cell key={i} fill={r.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card bg-white dark:bg-slate-900/80 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search feedback..." className="input-field pl-8 py-2 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto py-2 text-sm" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
          <option value="all">All Events</option>
          {(events ?? []).map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <select className="input-field w-auto py-2 text-sm" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
          <option value="all">All Ratings</option>
          {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
        </select>
      </div>

      {/* Feedback cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No feedback yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Share the feedback link with participants after an event.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fb, i) => (
            <motion.div
              key={fb.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card bg-white dark:bg-slate-900/80 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {fb.isAnonymous ? '?' : fb.participantName?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{fb.isAnonymous ? 'Anonymous' : fb.participantName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{getEventName(fb.eventId)} · {formatRelative(fb.submittedAt)}</p>
                  </div>
                </div>
                <StarRating value={fb.rating} readOnly size="sm" />
              </div>

              {fb.liked && (
                <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">What they liked</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{fb.liked}</p>
                </div>
              )}

              {fb.suggestions && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Suggestions</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{fb.suggestions}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
