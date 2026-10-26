import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, Trash2, RefreshCw, Shield, Database, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportAllData, importAllData, clearAllData, initializeData } from '../../services/dataService';
import { exportToJSON } from '../../utils/exportUtils';
import Button from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleExportBackup = async () => {
    setLoading(true);
    try {
      const data = await exportAllData();
      exportToJSON(data, `eventflow_backup_${new Date().toISOString().slice(0, 10)}.json`);
      toast.success('Backup downloaded');
    } catch { toast.error('Export failed'); }
    finally { setLoading(false); }
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
    } catch { toast.error('Failed to clear data'); }
    finally { setLoading(false); }
  };

  const handleReseed = async () => {
    setLoading(true);
    try {
      await clearAllData();
      // Remove the "seeded" flag so seed data runs again
      localStorage.removeItem('ef_seeded');
      await initializeData();
      setConfirmSeed(false);
      toast.success('Demo data reseeded! Reloading…');
      setTimeout(() => window.location.reload(), 1000);
    } catch { toast.error('Failed to reseed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your EventFlow data and configuration</p>
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
        <p className="text-xs text-slate-400 mt-4">
          This is a frontend-only demo. To change credentials, edit <code>AuthContext.jsx</code>.
        </p>
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Clear current data and re-seed with 5 events, 50 participants</p>
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

      {/* How to connect DB */}
      <div className="glass-card bg-white dark:bg-slate-900/80 p-6 space-y-3">
        <h2 className="font-bold text-slate-900 dark:text-white">How to Connect a Real Database</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li>Open <code className="text-primary-600 dark:text-primary-400 font-mono">src/services/dataService.js</code></li>
          <li>Find any function with the <code>// TODO: replace with DB call</code> comment</li>
          <li>Replace the localStorage logic with your API call (REST, Supabase, Firebase, etc.)</li>
          <li>The UI does not need to change — it only calls the exported async functions</li>
        </ol>
        <div className="p-3 bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 rounded-xl text-xs text-primary-700 dark:text-primary-300 font-mono">
          {`// Example: replace localStorage with Supabase\nexport async function getEvents() {\n  // TODO: replace with DB call\n  const { data } = await supabase.from('events').select();\n  return data;\n}`}
        </div>
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
        message="This will clear your current data and replace it with the demo dataset. Continue?"
      />
    </div>
  );
}
