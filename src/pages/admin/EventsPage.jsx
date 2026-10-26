import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Grid, List, Filter, Download, Upload,
  Edit, Trash2, Copy, Eye, Calendar, Users, ChevronDown,
  LayoutGrid, Table2, Share2, ExternalLink
} from 'lucide-react';
import { useAsync, useDebounce } from '../../hooks';
import {
  getEvents, deleteEvent, duplicateEvent, createEvent, updateEvent
} from '../../services/dataService';
import { exportToExcel, exportToCSV, parseFile, downloadEventsTemplate } from '../../utils/exportUtils';
import { formatDate, getBannerGradient, getCategoryColor } from '../../utils/helpers';
import Button from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Card';
import EventFormModal from './EventFormModal';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Technology', 'Cultural', 'Hackathon', 'Workshop', 'Business', 'Sports', 'Academic', 'Social'];
const STATUSES = ['All', 'open', 'closed', 'draft'];

export default function EventsPage() {
  const navigate = useNavigate();
  const { data: events, loading, refetch } = useAsync(() => getEvents());

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Filter + sort events
  const filtered = (events ?? []).filter((e) => {
    const matchSearch = !debouncedSearch ||
      e.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      e.description?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      e.venue?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  }).sort((a, b) => {
    if (sortBy === 'date') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'registrations') return (b.registrations ?? 0) - (a.registrations ?? 0);
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteEvent(deleteId);
      await refetch();
      setDeleteId(null);
      toast.success('Event deleted successfully');
    } catch (e) {
      toast.error('Failed to delete event');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateEvent(id);
      await refetch();
      toast.success('Event duplicated');
    } catch (e) {
      toast.error('Failed to duplicate event');
    }
  };

  const handleExportExcel = () => {
    const data = filtered.map((e) => ({
      Title: e.title, Category: e.category, Status: e.status,
      Date: formatDate(e.date), Venue: e.venue, Capacity: e.capacity,
      Registrations: e.registrations ?? 0,
    }));
    exportToExcel(data, 'events.xlsx', 'Events');
    toast.success('Exported to Excel');
  };

  const handleExportCSV = () => {
    const data = filtered.map((e) => ({
      Title: e.title, Category: e.category, Status: e.status,
      Date: formatDate(e.date), Venue: e.venue, Capacity: e.capacity,
      Registrations: e.registrations ?? 0,
    }));
    exportToCSV(data, 'events.csv');
    toast.success('Exported to CSV');
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { data } = await parseFile(file);
      let imported = 0;
      for (const row of data) {
        if (!row.title) continue;
        await createEvent({
          title: row.title || row.Title,
          description: row.description || row.Description || '',
          category: row.category || row.Category || 'Other',
          date: row.date || row.Date || new Date().toISOString(),
          time: row.time || row.Time || '10:00',
          venue: row.venue || row.Venue || '',
          capacity: parseInt(row.capacity || row.Capacity || '0', 10),
          status: row.status || row.Status || 'draft',
        });
        imported++;
      }
      await refetch();
      toast.success(`Imported ${imported} event${imported !== 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(`Import failed: ${err.message}`);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Events</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{events?.length ?? 0} events total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="ghost" size="sm" icon={Download} onClick={handleExportExcel}>Excel</Button>
          <Button variant="ghost" size="sm" icon={Download} onClick={handleExportCSV}>CSV</Button>
          <Button variant="ghost" size="sm" icon={Download} onClick={downloadEventsTemplate}>Template</Button>
          <label className="btn-ghost text-sm px-3.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-2">
            <Upload size={14} /> Import
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          </label>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowCreateModal(true)}>New Event</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card bg-white dark:bg-slate-900/80 p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search events..."
            className="input-field pl-8 py-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category */}
        <select
          className="input-field w-auto py-2 text-sm"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        {/* Status */}
        <select
          className="input-field w-auto py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUSES.map((s) => <option key={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>

        {/* Sort */}
        <select
          className="input-field w-auto py-2 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date">Sort: Date</option>
          <option value="registrations">Sort: Registrations</option>
          <option value="title">Sort: Title</option>
        </select>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}>
            <Table2 size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Calendar size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No events found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            {search || categoryFilter !== 'All' || statusFilter !== 'All'
              ? 'Try adjusting your filters.'
              : 'Create your first event to get started.'}
          </p>
          <Button variant="primary" icon={Plus} onClick={() => setShowCreateModal(true)}>Create Event</Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card bg-white dark:bg-slate-900/80 overflow-hidden group"
            >
              {/* Banner */}
              <div className={`h-32 ${getBannerGradient(event)} relative flex items-center justify-center`}>
                <span className="text-4xl">{event.emoji ?? '📅'}</span>
                <div className="absolute top-2 left-2"><StatusBadge status={event.status} /></div>
                {/* Actions overlay */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditEvent(event)} className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/40 transition-colors"><Edit size={14} /></button>
                  <button onClick={() => handleDuplicate(event.id)} className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/40 transition-colors"><Copy size={14} /></button>
                  <button onClick={() => setDeleteId(event.id)} className="p-1.5 bg-red-500/70 backdrop-blur-sm rounded-lg text-white hover:bg-red-600 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="p-4">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getCategoryColor(event.category)}`}>
                  {event.category}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white mt-2 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {event.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{event.description}</p>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(event.date, 'MMM d, yyyy')}</span>
                  <span className="flex items-center gap-1"><Users size={11} />{event.registrations ?? 0}</span>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" size="xs" icon={Users} onClick={() => navigate(`/admin/participants?event=${event.id}`)}>Participants</Button>
                  <Button variant="ghost" size="xs" icon={ExternalLink} onClick={() => window.open(`/register/${event.id}`, '_blank')}>View</Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Table view */
        <div className="glass-card bg-white dark:bg-slate-900/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Capacity</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event, i) => (
                  <motion.tr key={event.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td>
                      <div className="font-semibold text-slate-900 dark:text-white">{event.title}</div>
                    </td>
                    <td>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </span>
                    </td>
                    <td>{formatDate(event.date, 'MMM d, yyyy')}</td>
                    <td className="max-w-[200px] truncate">{event.venue}</td>
                    <td>{event.capacity || '∞'}</td>
                    <td>{event.registrations ?? 0}</td>
                    <td><StatusBadge status={event.status} /></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button title="Edit" onClick={() => setEditEvent(event)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary-600"><Edit size={14} /></button>
                        <button title="Duplicate" onClick={() => handleDuplicate(event.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600"><Copy size={14} /></button>
                        <button title="Participants" onClick={() => navigate(`/admin/participants?event=${event.id}`)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600"><Users size={14} /></button>
                        <button title="Delete" onClick={() => setDeleteId(event.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-500 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        message="Are you sure you want to delete this event? All participants and feedback for this event will also be deleted. This action cannot be undone."
      />

      <EventFormModal
        isOpen={showCreateModal || !!editEvent}
        onClose={() => { setShowCreateModal(false); setEditEvent(null); }}
        event={editEvent}
        onSave={async () => { await refetch(); setShowCreateModal(false); setEditEvent(null); }}
      />
    </div>
  );
}
