import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Download, ArrowRight, ArrowLeft } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import FileDropzone from '../../components/ui/FileDropzone';
import { parseFile, exportToExcel } from '../../utils/exportUtils';
import { bulkAddParticipants } from '../../services/dataService';
import toast from 'react-hot-toast';

const REQUIRED_FIELDS = ['name', 'email'];
const ALL_FIELDS = ['name', 'email', 'phone', 'college', 'department', 'year'];

const STEPS = ['upload', 'mapping', 'preview', 'processing', 'result'];

export default function BulkUploadModal({ isOpen, onClose, events, onSuccess }) {
  const [step, setStep] = useState(0); // index into STEPS
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [mapping, setMapping] = useState({});
  const [eventId, setEventId] = useState('');
  const [duplicateStrategy, setDuplicateStrategy] = useState('skip');
  const [progress, setProgress] = useState(0);
  const [validRows, setValidRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [result, setResult] = useState(null);
  const workerRef = useRef(null);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(0); setFile(null); setParsedData(null); setColumns([]);
      setMapping({}); setProgress(0); setValidRows([]); setErrors([]); setResult(null);
    }
    if (isOpen && events?.length > 0 && !eventId) {
      setEventId(events[0].id);
    }
  }, [isOpen]);

  const handleFileParsed = async (f) => {
    setFile(f);
    try {
      const { data, columns: cols } = await parseFile(f);
      setParsedData(data);
      setColumns(cols);
      // Auto-map columns with matching names
      const autoMap = {};
      ALL_FIELDS.forEach((field) => {
        const match = cols.find((c) => c.toLowerCase().replace(/[\s_]/g, '') === field.toLowerCase());
        if (match) autoMap[field] = match;
      });
      setMapping(autoMap);
    } catch (e) {
      toast.error(`Could not parse file: ${e.message}`);
    }
  };

  const handleRunWorker = () => {
    setStep(STEPS.indexOf('processing'));
    setProgress(0);

    // Use inline worker (avoids worker URL issues with Vite)
    const workerCode = `
      const CHUNK_SIZE = 500;
      self.onmessage = async function(e) {
        const { rows, fieldMapping, requiredFields } = e.data;
        const results = [], errors = [];
        const emailsSeen = new Set();
        const total = rows.length;
        let processed = 0;
        for (let cs = 0; cs < total; cs += CHUNK_SIZE) {
          const chunk = rows.slice(cs, cs + CHUNK_SIZE);
          chunk.forEach((rawRow, ci) => {
            const rowNum = cs + ci + 1;
            const mapped = {};
            for (const [field, src] of Object.entries(fieldMapping)) {
              mapped[field] = rawRow[src]?.toString().trim() ?? '';
            }
            const rowErrors = [];
            for (const f of requiredFields) { if (!mapped[f]) rowErrors.push('Missing: ' + f); }
            if (mapped.email) {
              if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(mapped.email)) rowErrors.push('Invalid email');
              else if (emailsSeen.has(mapped.email.toLowerCase())) rowErrors.push('Duplicate in file');
              else emailsSeen.add(mapped.email.toLowerCase());
            }
            if (rowErrors.length > 0) errors.push({ row: rowNum, reasons: rowErrors, data: rawRow });
            else results.push(mapped);
          });
          processed += chunk.length;
          self.postMessage({ type: 'PROGRESS', payload: { processed, total, percent: Math.round(processed/total*100), validSoFar: results.length, errorsSoFar: errors.length } });
          await new Promise(r => setTimeout(r, 0));
        }
        self.postMessage({ type: 'DONE', payload: { results, errors, total, valid: results.length } });
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    workerRef.current = worker;

    worker.postMessage({
      rows: parsedData,
      fieldMapping: mapping,
      requiredFields: REQUIRED_FIELDS,
    });

    worker.onmessage = async (e) => {
      const { type, payload } = e.data;
      if (type === 'PROGRESS') {
        setProgress(payload.percent);
      } else if (type === 'DONE') {
        worker.terminate();
        URL.revokeObjectURL(url);
        setValidRows(payload.results);
        setErrors(payload.errors);

        // Insert valid rows
        try {
          const res = await bulkAddParticipants(eventId, payload.results, { duplicateStrategy });
          setResult({ ...res, totalErrors: payload.errors.length });
          setStep(STEPS.indexOf('result'));
          toast.success(`Import complete: ${res.added} added, ${res.skipped} skipped`);
        } catch (err) {
          toast.error('Failed to save participants: ' + err.message);
          setStep(STEPS.indexOf('preview'));
        }
      }
    };

    worker.onerror = (e) => {
      toast.error('Worker error: ' + e.message);
      setStep(STEPS.indexOf('preview'));
    };
  };

  const downloadErrors = () => {
    const data = errors.map((e) => ({
      Row: e.row,
      Reason: e.reasons.join('; '),
      ...e.data,
    }));
    exportToExcel(data, 'upload_errors.xlsx', 'Errors');
  };

  const currentStep = STEPS[step];

  return (
    <Modal
      isOpen={isOpen}
      onClose={currentStep === 'processing' ? undefined : onClose}
      preventClose={currentStep === 'processing'}
      title="Bulk Upload Participants"
      size="lg"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6">
        {['Upload', 'Map Columns', 'Preview', 'Processing', 'Done'].map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              i < step ? 'bg-emerald-500 text-white' :
              i === step ? 'bg-primary-600 text-white' :
              'bg-slate-200 dark:bg-slate-700 text-slate-400'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-slate-400'}`}>{s}</span>
            {i < 4 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {currentStep === 'upload' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Event</label>
            <select className="input-field" value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </div>

          <FileDropzone onFile={handleFileParsed} label="Drop your Excel or CSV file here" hint="Supports .xlsx, .xls, .csv — up to 50MB (10,000+ rows supported)" />

          {parsedData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2"
            >
              <CheckCircle size={16} className="text-emerald-500" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Parsed <strong>{parsedData.length.toLocaleString()}</strong> rows with {columns.length} columns.
              </p>
            </motion.div>
          )}

          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" icon={Download} onClick={() => { const { downloadParticipantTemplate } = require('../../utils/exportUtils'); downloadParticipantTemplate(); }}>
              Download Template
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconRight={ArrowRight}
              disabled={!parsedData}
              onClick={() => setStep(1)}
            >
              Next: Map Columns
            </Button>
          </div>
        </div>
      )}

      {/* Step: Mapping */}
      {currentStep === 'mapping' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Map your spreadsheet columns to the participant fields. <span className="text-red-500">*</span> fields are required.
          </p>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {ALL_FIELDS.map((field) => (
              <div key={field} className="flex items-center gap-3">
                <label className="w-32 text-sm font-medium text-slate-700 dark:text-slate-300 capitalize flex-shrink-0">
                  {field}{REQUIRED_FIELDS.includes(field) && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <select
                  className="input-field flex-1 py-2 text-sm"
                  value={mapping[field] ?? ''}
                  onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                >
                  <option value="">— Skip this field —</option>
                  {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Duplicate strategy */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Duplicate Email Strategy</p>
            {[
              { value: 'skip', label: 'Skip duplicates (keep existing)' },
              { value: 'update', label: 'Update existing participants' },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-amber-700 dark:text-amber-300">
                <input type="radio" name="dupStrategy" value={opt.value} checked={duplicateStrategy === opt.value} onChange={(e) => setDuplicateStrategy(e.target.value)} className="text-primary-600" />
                {opt.label}
              </label>
            ))}
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep(0)}>Back</Button>
            <Button
              variant="primary"
              iconRight={ArrowRight}
              disabled={REQUIRED_FIELDS.some((f) => !mapping[f])}
              onClick={() => setStep(2)}
            >
              Preview Data
            </Button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {currentStep === 'preview' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Preview of the first 5 rows after mapping. Total: <strong>{parsedData?.length.toLocaleString()}</strong> rows.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800">
                  {ALL_FIELDS.filter((f) => mapping[f]).map((f) => (
                    <th key={f} className="px-3 py-2 text-left font-semibold text-slate-500 capitalize">{f}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(parsedData ?? []).slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                    {ALL_FIELDS.filter((f) => mapping[f]).map((f) => (
                      <td key={f} className="px-3 py-2 text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                        {row[mapping[f]] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" iconRight={ArrowRight} onClick={handleRunWorker}>
              Start Import ({parsedData?.length.toLocaleString()} rows)
            </Button>
          </div>
        </div>
      )}

      {/* Step: Processing */}
      {currentStep === 'processing' && (
        <div className="space-y-6 text-center py-8">
          <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center mx-auto">
            <div className="w-10 h-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-lg">Processing {parsedData?.length.toLocaleString()} rows…</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Using a Web Worker so your UI stays smooth</p>
          </div>
          <div className="progress-bar mx-auto max-w-sm">
            <motion.div
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-primary-600 dark:text-primary-400 font-semibold">{progress}%</p>
        </div>
      )}

      {/* Step: Result */}
      {currentStep === 'result' && result && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Added', value: result.added, color: 'emerald' },
              { label: 'Updated', value: result.updated, color: 'blue' },
              { label: 'Skipped', value: result.skipped, color: 'amber' },
              { label: 'Errors', value: result.totalErrors, color: 'red' },
            ].map((s) => (
              <div key={s.label} className={`p-4 rounded-xl text-center bg-${s.color}-50 dark:bg-${s.color}-950/50 border border-${s.color}-200 dark:border-${s.color}-800`}>
                <div className={`text-2xl font-bold text-${s.color}-700 dark:text-${s.color}-300`}>{s.value}</div>
                <div className={`text-xs text-${s.color}-600 dark:text-${s.color}-400 font-medium`}>{s.label}</div>
              </div>
            ))}
          </div>

          {errors.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle size={16} />
                <p className="font-semibold text-sm">{errors.length} row(s) had errors</p>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 text-xs text-red-600 dark:text-red-400">
                {errors.slice(0, 10).map((e, i) => (
                  <p key={i}>Row {e.row}: {e.reasons.join(', ')}</p>
                ))}
                {errors.length > 10 && <p className="font-semibold">… and {errors.length - 10} more</p>}
              </div>
              <Button variant="ghost" size="sm" icon={Download} onClick={downloadErrors}>Download Error Report</Button>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="primary" icon={CheckCircle} onClick={onSuccess}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
