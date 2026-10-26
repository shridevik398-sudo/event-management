import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Upload, Trash2, RefreshCw, Shield, Database,
  CheckCircle2, AlertCircle, ArrowUpRight, Cloud
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  exportAllData,
  importAllData,
  clearAllData,
  seedDemoData,
  migrateLocalStorageToSupabase,
  LOCAL_KEYS
} from '../../services/dataService';
import { isSupabaseConfigured, getSupabaseConfig } from '../../lib/supabase';
import { exportToJSON } from '../../utils/exportUtils';
import Button from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localCounts, setLocalCounts] = useState({ events: 0, participants: 0, feedback: 0 });
  const { user } = useAuth();
  const navigate = useNavigate();

  const supabaseConfig = getSupabaseConfig();

  // Check how many records exist in localStorage for migration
  useEffect(() => {
    try {
      const e = JSON.parse(localStorage.getItem(LOCAL_KEYS.EVENTS) || '[]');
      const p = JSON.parse(localStorage.getItem(LOCAL_KEYS.PARTICIPANTS) || '[]');
      const f = JSON.parse(localStorage.getItem(LOCAL_KEYS.FEEDBACK) || '[]');
      setLocalCounts({ events: e.length, participants: p.length, feedback: f.length });
    } catch {
      // Ignore parse errors
    }
  }, []);

  const totalLocalRecords = localCounts.events + localCounts.participants + localCounts.feedback;

  const handleExportBackup = async () => {
    setLoading(true);
    try {
      const data = await exportAllData();
      exportToJSON(data, `eventflow_backup_${new Date().toISOString().slice(0, 10)}.json`);
      toast.success('Backup downloaded');
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importAllData(data);
      toast.success('Backup restored successfully! Reloading…');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleClearData = async () => {
    setLoading(true);
    try {
      await clearAllData();
      setConfirmClear(false);
      toast.success('All data cleared. Reloading…');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Failed to clear data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReseed = async () => {
    setLoading(true);
    try {
      await clearAllData();
      const result = await seedDemoData(true);
      setConfirmSeed(false);
      toast.success(`Reseeded: ${result.events} events, ${result.participants} participants! Reloading…`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Failed to reseed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateLocal = async () => {
    setLoading(true);
    try {
      const res = await migrateLocalStorageToSupabase();
      toast.success(
        `Migrated ${res.events} events, ${res.participants} participants, ${res.feedback} feedback to Supabase!`
      );
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      toast.error('Migration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your EventFlow database, data, and configuration</p>
      </div>

      {/* Database Connection Status Card */}
      <div className="glass-card bg-white dark:bg-slate-900/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud size={20} className="text-primary-600 dark:text-primary-400" />
            <h2 className="font-bold text-slate-900 dark:text-white">Database Integration</h2>
          </div>
          {supabaseConfig.configured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 size={13} /> Supabase Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <AlertCircle size={13} /> LocalStorage Fallback
            </span>
          )}
        </div>

        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-medium">Backend Provider</span>
            <span className="font-semibold">{supabaseConfig.configured ? 'Supabase PostgreSQL' : 'Browser LocalStorage'}</span>
          </div>
          {supabaseConfig.configured && (
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-medium">Supabase URL</span>
              <code className="text-primary-600 dark:text-primary-400 font-mono text-xs">
                {supabaseConfig.url.slice(0, 28)}…
              </code>
            </div>
          )}
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Active Tables</span>
            <span className="font-mono text-xs">events, participants, feedback, settings</span>
          </div>
        </div>

        {/* Migrate browser records button */}
        {supabaseConfig.configured && totalLocalRecords > 0 && (
          <div className="p-3.5 bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 rounded-xl flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-primary-900 dark:text-primary-200">
                Found {totalLocalRecords} records in browser storage
              </p>
              <p className="text-xs text-primary-700 dark:text-primary-400">
                {localCounts.events} events, {localCounts.participants} participants, {localCounts.feedback} feedback
              </p>
            </div>
            <Button variant="primary" size="xs" icon={ArrowUpRight} loading={loading} onClick={handleMigrateLocal}>
              Sync to Supabase
            </Button>
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="glass-card bg-white dark:bg-slate-900/80 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-primary-600 dark:text-primary-400" />
          <h2 className="font-bold text-slate-900 dark:text-white">Admin Account</h2>
        </div>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-medium">Username</span>
            <code className="text-primary-600 dark:text-primary-400 font-mono">{user?.username}</code>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-medium">Role</span>
            <span className="capitalize font-semibold">{user?.role}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Logged in at</span>
            <span>{user?.loggedInAt ? new Date(user.loggedInAt).toLocaleString() : '—'}</span>
          </div>
        </div>
      </div>

      {/* Data management */}
      <div className="glass-card bg-white dark:bg-slate-900/80 p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Database size={20} className="text-primary-600 dark:text-primary-400" />
          <h2 className="font-bold text-slate-900 dark:text-white">Data Management</h2>
        </div>

        {/* Export backup */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">Export Full Backup</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Download all events, participants, and feedback as JSON</p>
          </div>
          <Button variant="secondary" size="sm" icon={Download} loading={loading} onClick={handleExportBackup}>
            Download
          </Button>
        </div>

        {/* Import backup */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">Restore from Backup</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Upload a JSON backup file to restore all data</p>
          </div>
          <label className="cursor-pointer">
            <span className="btn-secondary text-sm px-3.5 py-1.5 rounded-xl flex items-center gap-2">
              <Upload size={14} /> Restore
            </span>
            <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
          </label>
        </div>

        {/* Reseed demo data */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">Reload Demo Data</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Explicitly seed with 5 events, 50 participants, and feedback</p>
          </div>
          <Button variant="warning" size="sm" icon={RefreshCw} onClick={() => setConfirmSeed(true)}>
            Reseed
          </Button>
        </div>

        {/* Clear all */}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-red-600 dark:text-red-400 text-sm">Clear All Data</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Permanently delete all events, participants, and feedback</p>
          </div>
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirmClear(true)}>
            Clear
          </Button>
        </div>
      </div>

      {/* Database Setup instructions */}
      <div className="glass-card bg-white dark:bg-slate-900/80 p-6 space-y-3">
        <h2 className="font-bold text-slate-900 dark:text-white">Supabase Configuration</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Configure the following environment variables in Vercel or your local <code>.env</code> file:
        </p>
        <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono space-y-1 overflow-x-auto">
          <p>VITE_SUPABASE_URL=https://your-project-id.supabase.co</p>
          <p>VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-or-publishable-key</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The database SQL migration script is located in <code>supabase/schema.sql</code>. Execute it in the Supabase SQL Editor.
        </p>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearData}
        loading={loading}
        title="Clear All Data"
        message="This will permanently delete ALL events, participants, and feedback. This action cannot be undone."
      />
      <ConfirmModal
        isOpen={confirmSeed}
        onClose={() => setConfirmSeed(false)}
        onConfirm={handleReseed}
        loading={loading}
        title="Reload Demo Data"
        message="This will clear current data and replace it with the demo dataset. Continue?"
      />
    </div>
  );
}
