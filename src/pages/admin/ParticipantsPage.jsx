import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Download, Upload, Trash2, Edit, Check, X,
  CheckSquare, Filter, ChevronLeft, ChevronRight, AlertTriangle,
  RefreshCw, SlidersHorizontal
} from 'lucide-react';
import { useAsync, useDebounce } from '../../hooks';
import {
  getParticipants, getEvents, updateParticipant, deleteParticipant,
  bulkDeleteParticipants, toggleAttendance, bulkAddParticipants
} from '../../services/dataService';
import { exportToExcel, exportToCSV, parseFile, downloadParticipantTemplate, formatParticipantsForExport } from '../../utils/exportUtils';
import { formatDate, formatRelative } from '../../utils/helpers';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { SkeletonCard } from '../../components/ui/Card';
import BulkUploadModal from './BulkUploadModal';
import toast from 'react-hot-toast';

const PAGE_SIZE = 25;

export default function ParticipantsPage() {
  const { data: participants, loading: pLoading, refetch } = useAsync(() => getParticipants());
  const { data: events, loading: eLoading } = useAsync(() => getEvents());

  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [sortKey, setSortKey] = useState('registeredAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [editParticipant, setEditParticipant] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const filtered = (participants ?? []).filter((p) => {
    const matchSearch = !debouncedSearch ||
      p.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.college?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.registrationId?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchEvent = eventFilter === 'all' || p.eventId === eventFilter;
    const matchAtt = attendanceFilter === 'all' || (attendanceFilter === 'attended' ? p.attended : !p.attended);
    return matchSearch && matchEvent && matchAtt;
  }).sort((a, b) => {
    let va = a[sortKey], vb = b[sortKey];
    if (sortKey === 'registeredAt') { va = new Date(va || 0); vb = new Date(vb || 0); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const toggleSelect = (id) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((p) => p.id)));
  };

  const handleAttendance = async (id) => {
    try {
      await toggleAttendance(id);
      await refetch();
      toast.success('Attendance updated');
    } catch { toast.error('Failed to update attendance'); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteParticipant(deleteId);
      await refetch();
      setDeleteId(null);
      toast.success('Participant removed');
    } catch { toast.error('Delete failed'); }
    finally { setDeleteLoading(false); }
  };

  const handleBulkDelete = async () => {
    setDeleteLoading(true);
    try {
      await bulkDeleteParticipants([...selected]);
      setSelected(new Set());
      await refetch();
      setBulkDeleteOpen(false);
      toast.success(`${selected.size} participant(s) deleted`);
    } catch { toast.error('Bulk delete failed'); }
    finally { setDeleteLoading(false); }
  };

  const handleExportExcel = () => {
    const data = formatParticipantsForExport(filtered, events ?? []);
    exportToExcel(data, 'participants.xlsx', 'Participants');
    toast.success('Exported to Excel');
  };

  const handleExportCSV = () => {
    const data = formatParticipantsForExport(filtered, events ?? []);
    exportToCSV(data, 'participants.csv');
    toast.success('Exported to CSV');
  };

  const getEventName = (eventId) => events?.find((e) => e.id === eventId)?.title ?? eventId;

  const SortHeader = ({ col, label }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 select-none"
      onClick={() => toggleSort(col)}
    >
      {label} {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  if (pLoading) return (
    <div className="space-y-4">
      <SkeletonCard lines={1} />
      <SkeletonCard lines={6} />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Participants</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {filtered.length} participant{filtered.length !== 1 ? 's' : ''} {eventFilter !== 'all' ? `in ${getEventName(eventFilter)}` : 'across all events'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="ghost" size="sm" icon={Download} onClick={handleExportExcel}>Excel</Button>
          <Button variant="ghost" size="sm" icon={Download} onClick={handleExportCSV}>CSV</Button>
          <Button variant="ghost" size="sm" icon={Download} onClick={downloadParticipantTemplate}>Template</Button>
          <Button variant="secondary" size="sm" icon={Upload} onClick={() => setBulkUploadOpen(true)}>Bulk Upload</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card bg-white dark:bg-slate-900/80 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, ID..."
            className="input-field pl-8 py-2 text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="input-field w-auto py-2 text-sm"
          value={eventFilter}
          onChange={(e) => { setEventFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All Events</option>
          {(events ?? []).map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>

        <select
          className="input-field w-auto py-2 text-sm"
          value={attendanceFilter}
          onChange={(e) => { setAttendanceFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All Attendance</option>
          <option value="attended">Attended</option>
          <option value="not_attended">Not Attended</option>
        </select>

        {selected.size > 0 && (
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => setBulkDeleteOpen(true)}>
            Delete {selected.size} selected
          </Button>
        )}
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="text-center py-20">
          <Users size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No participants found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {search ? 'Try a different search term.' : 'Participants will appear here once they register.'}
          </p>
        </div>
      ) : (
        <div className="glass-card bg-white dark:bg-slate-900/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={selected.size > 0 && selected.size === paginated.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <SortHeader col="name" label="Name" />
                  <SortHeader col="email" label="Email" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">College</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">Event</th>
                  <SortHeader col="registeredAt" label="Registered" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">Attendance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${selected.has(p.id) ? 'bg-primary-50 dark:bg-primary-950/30' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input type="checkbox" className="custom-checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{p.registrationId}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.email}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[140px] truncate">{p.college}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[140px] truncate">{getEventName(p.eventId)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{formatRelative(p.registeredAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleAttendance(p.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          p.attended
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                        }`}
                      >
                        {p.attended ? <Check size={12} /> : <X size={12} />}
                        {p.attended ? 'Attended' : 'Absent'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button title="Edit" onClick={() => setEditParticipant(p)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary-600 transition-colors"><Edit size={14} /></button>
                        <button title="Delete" onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-slate-600 dark:text-slate-400 px-2">
                {page} / {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editParticipant && (
        <Modal
          isOpen={!!editParticipant}
          onClose={() => setEditParticipant(null)}
          title="Edit Participant"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditParticipant(null)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={async () => {
                  await updateParticipant(editParticipant.id, editParticipant);
                  await refetch();
                  setEditParticipant(null);
                  toast.success('Participant updated');
                }}
              >
                Save Changes
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {['name', 'email', 'phone', 'college', 'department', 'year'].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 capitalize mb-1">{field}</label>
                <input
                  type="text"
                  className="input-field"
                  value={editParticipant[field] ?? ''}
                  onChange={(e) => setEditParticipant((p) => ({ ...p, [field]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleteLoading} message="Remove this participant? This cannot be undone." />

      {/* Bulk delete confirm */}
      <ConfirmModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        loading={deleteLoading}
        title={`Delete ${selected.size} Participants`}
        message={`Are you sure you want to delete ${selected.size} participant(s)? This cannot be undone.`}
      />

      {/* Bulk upload */}
      <BulkUploadModal
        isOpen={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        events={events ?? []}
        onSuccess={async () => { await refetch(); setBulkUploadOpen(false); }}
      />
    </div>
  );
}
