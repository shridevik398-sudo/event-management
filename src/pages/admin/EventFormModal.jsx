import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input, { Textarea, Select } from '../../components/ui/Input';
import { createEvent, updateEvent } from '../../services/dataService';
import { v4 as uuidv4 } from '../../utils/uuid';
import toast from 'react-hot-toast';

const CATEGORIES = ['Technology', 'Cultural', 'Hackathon', 'Workshop', 'Business', 'Sports', 'Academic', 'Social', 'Other'];
const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
];

function CustomFieldBuilder({ fields, onChange }) {
  const addField = () => {
    onChange([...fields, { id: uuidv4(), type: 'text', label: '', placeholder: '', required: false, options: [] }]);
  };

  const removeField = (id) => onChange(fields.filter((f) => f.id !== id));

  const updateField = (id, updates) => {
    onChange(fields.map((f) => f.id === id ? { ...f, ...updates } : f));
  };

  const moveUp = (i) => {
    if (i === 0) return;
    const arr = [...fields];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    onChange(arr);
  };

  const moveDown = (i) => {
    if (i === fields.length - 1) return;
    const arr = [...fields];
    [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
    onChange(arr);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Custom Fields</label>
        <Button variant="ghost" size="xs" icon={Plus} onClick={addField}>Add Field</Button>
      </div>

      <AnimatePresence>
        {fields.map((field, i) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveUp(i)} disabled={i === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30"><ChevronUp size={14} /></button>
                <button onClick={() => moveDown(i)} disabled={i === fields.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30"><ChevronDown size={14} /></button>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Field label"
                  className="input-field py-2 text-sm"
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                />
                <select
                  className="input-field py-2 text-sm"
                  value={field.type}
                  onChange={(e) => updateField(field.id, { type: e.target.value })}
                >
                  {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <button onClick={() => removeField(field.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>

            {/* Dropdown options */}
            {field.type === 'dropdown' && (
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Options (comma-separated)</p>
                <input
                  type="text"
                  placeholder="Option A, Option B, Option C"
                  className="input-field py-2 text-sm"
                  value={(field.options ?? []).join(', ')}
                  onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                />
              </div>
            )}

            {/* Placeholder */}
            {field.type !== 'checkbox' && field.type !== 'dropdown' && (
              <input
                type="text"
                placeholder="Placeholder text (optional)"
                className="input-field py-2 text-sm"
                value={field.placeholder ?? ''}
                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
              />
            )}

            {/* Required toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={field.required}
                onChange={(e) => updateField(field.id, { required: e.target.checked })}
              />
              Required field
            </label>
          </motion.div>
        ))}
      </AnimatePresence>

      {fields.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          No custom fields yet. Click "Add Field" to add one.
        </p>
      )}
    </div>
  );
}

export default function EventFormModal({ isOpen, onClose, event, onSave }) {
  const isEdit = !!event;
  const [loading, setLoading] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', category: 'Technology', date: '', time: '09:00',
    venue: '', capacity: '', deadline: '', status: 'draft', emoji: '📅',
    customFields: [],
  });

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title ?? '',
        description: event.description ?? '',
        category: event.category ?? 'Technology',
        date: event.date ? event.date.slice(0, 10) : '',
        time: event.time ?? '09:00',
        venue: event.venue ?? '',
        capacity: event.capacity ?? '',
        deadline: event.deadline ?? '',
        status: event.status ?? 'draft',
        emoji: event.emoji ?? '📅',
        customFields: event.customFields ?? [],
      });
    } else {
      setForm({ title: '', description: '', category: 'Technology', date: '', time: '09:00', venue: '', capacity: '', deadline: '', status: 'draft', emoji: '📅', customFields: [] });
      setBannerPreview(null);
    }
  }, [event, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date) { toast.error('Title and date are required'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        date: new Date(form.date + 'T' + form.time).toISOString(),
        capacity: form.capacity ? parseInt(form.capacity, 10) : 0,
      };
      if (isEdit) {
        await updateEvent(event.id, payload);
        toast.success('Event updated!');
      } else {
        await createEvent(payload);
        toast.success('Event created!');
      }
      onSave();
    } catch (err) {
      toast.error(err.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const emojis = ['📅', '💻', '🎭', '🏆', '🤖', '🚀', '🎨', '🎵', '🏋️', '📚', '🌍', '💡'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Event' : 'Create New Event'}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {isEdit ? 'Save Changes' : 'Create Event'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Emoji picker */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Event Icon</label>
          <div className="flex flex-wrap gap-2">
            {emojis.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setForm((f) => ({ ...f, emoji: em }))}
                className={`text-2xl p-2 rounded-xl transition-all ${form.emoji === em ? 'bg-primary-100 dark:bg-primary-950 ring-2 ring-primary-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* Banner image */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Banner Image (optional)</label>
          <div className="flex items-center gap-3">
            <label className="btn-ghost text-sm px-3 py-2 rounded-xl cursor-pointer">
              Choose File
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setBannerPreview(ev.target.result);
                    reader.readAsDataURL(f);
                  }
                }}
              />
            </label>
            {bannerPreview && (
              <img src={bannerPreview} alt="banner" className="h-12 w-24 rounded-lg object-cover" />
            )}
          </div>
        </div>

        {/* Core fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Event Title" required placeholder="TechSummit 2025" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Description" placeholder="Describe the event..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
          <Select label="Category" required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Select label="Status" required value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </Select>
          <Input label="Date" type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <Input label="Time" type="time" required value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
          <div className="sm:col-span-2">
            <Input label="Venue / Online Link" placeholder="Conference Hall A or https://meet.google.com/..." value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} />
          </div>
          <Input label="Capacity" type="number" placeholder="0 = unlimited" min="0" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} hint="Set to 0 for unlimited" />
          <Input label="Registration Deadline" type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
        </div>

        {/* Custom fields builder */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <CustomFieldBuilder
            fields={form.customFields}
            onChange={(fields) => setForm((f) => ({ ...f, customFields: fields }))}
          />
        </div>
      </form>
    </Modal>
  );
}
