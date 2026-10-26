import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';

export default function FileDropzone({ onFile, accept = '.xlsx,.xls,.csv', maxSize = 50, label, hint }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const sizeMB = f.size / 1024 / 1024;
    if (sizeMB > maxSize) {
      alert(`File too large. Max ${maxSize}MB allowed.`);
      return;
    }
    setFile(f);
    onFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleChange = (e) => handleFile(e.target.files[0]);

  const clear = (e) => {
    e.stopPropagation();
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      className={`drop-zone ${isDragging ? 'drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />

      <AnimatePresence mode="wait">
        {file ? (
          <motion.div
            key="file"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-3"
          >
            <CheckCircle size={24} className="text-emerald-500" />
            <div className="text-left">
              <p className="font-semibold text-slate-800 dark:text-slate-200">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={clear}
              className="ml-2 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-950 text-red-500 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <motion.div
              animate={{ y: isDragging ? -8 : 0 }}
              className="flex justify-center"
            >
              <div className="p-4 bg-primary-50 dark:bg-primary-950 rounded-2xl">
                <Upload size={32} className="text-primary-500" />
              </div>
            </motion.div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                {label || 'Drop your file here, or click to browse'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {hint || `Supports ${accept.replace(/\./g, '').replace(/,/g, ', ')} files up to ${maxSize}MB`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
