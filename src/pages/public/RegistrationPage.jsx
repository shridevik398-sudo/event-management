import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Calendar, MapPin, Users, Share2, Copy, Check, AlertCircle, Globe } from 'lucide-react';
import { useAsync, useCopy } from '../../hooks';
import { getEvent, addParticipant } from '../../services/dataService';
import { formatDate, validateEmail, validatePhone, getBannerGradient } from '../../utils/helpers';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Card';
import Navbar from '../../components/layout/Navbar';
import toast from 'react-hot-toast';

/* Registration success screen */
function SuccessScreen({ registrationId, event, participant }) {
  const navigate = useNavigate();
  const { copied, copy } = useCopy();

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="text-center py-12 space-y-6"
    >
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', damping: 15 }}
        className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto"
      >
        <CheckCircle size={48} className="text-emerald-500" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Registration Confirmed!</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          You're registered for <strong>{event.title}</strong>
        </p>
      </motion.div>

      {/* Registration ID card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="inline-block glass-card bg-white dark:bg-slate-900/80 px-8 py-5 rounded-2xl"
      >
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Your Registration ID</p>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-mono font-bold text-primary-600 dark:text-primary-400">{registrationId}</span>
          <button
            onClick={() => copy(registrationId)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">Save this for entry on the day</p>
      </motion.div>

      {/* Event details */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-2 text-sm text-slate-600 dark:text-slate-400"
      >
        <p className="flex items-center justify-center gap-2"><Calendar size={14} />{formatDate(event.date, 'PPPP')}, {event.time}</p>
        <p className="flex items-center justify-center gap-2"><MapPin size={14} />{event.venue}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex gap-3 justify-center flex-wrap"
      >
        <Button variant="secondary" size="sm" icon={Share2} onClick={() => copy(window.location.href)}>
          Share Registration Link
        </Button>
        <Button variant="primary" size="sm" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </motion.div>
    </motion.div>
  );
}

/* Custom field renderer */
function CustomFieldInput({ field, value, onChange }) {
  if (field.type === 'dropdown') {
    return (
      <Select label={field.label} required={field.required} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select {field.label}</option>
        {(field.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </Select>
    );
  }
  if (field.type === 'checkbox') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={field.id}
          className="custom-checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <label htmlFor={field.id} className="text-sm text-slate-700 dark:text-slate-300">
          {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
    );
  }
  return (
    <Input
      label={field.label}
      type={field.type === 'number' ? 'number' : 'text'}
      placeholder={field.placeholder}
      required={field.required}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function RegistrationPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { data: event, loading, error } = useAsync(() => getEvent(eventId), [eventId]);

  const [form, setForm] = useState({ name: '', email: '', phone: '', college: '', department: '', year: '' });
  const [customValues, setCustomValues] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const { copy } = useCopy();

  const shareUrl = window.location.href;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!validateEmail(form.email)) e.email = 'Enter a valid email';
    if (form.phone && !validatePhone(form.phone)) e.phone = 'Enter a valid 10-digit Indian phone number';
    if (!form.college.trim()) e.college = 'College/Organization is required';
    // Validate required custom fields
    event?.customFields?.forEach((f) => {
      if (f.required && !customValues[f.id]) e[`custom_${f.id}`] = `${f.label} is required`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await addParticipant({
        ...form,
        eventId,
        customFieldValues: customValues,
      });
      setSuccess(result);
    } catch (err) {
      if (err.message === 'DUPLICATE_EMAIL') {
        setErrors({ email: 'This email is already registered for this event.' });
        toast.error('Duplicate registration detected!');
      } else if (err.message === 'CAPACITY_REACHED') {
        toast.error('Sorry, this event has reached full capacity!');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 px-4">
      <Navbar />
      <div className="max-w-2xl mx-auto mt-8 space-y-4">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={6} />
      </div>
    </div>
  );

  if (error || !event) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <Navbar />
      <div className="text-center">
        <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Event Not Found</h2>
        <Button variant="primary" onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    </div>
  );

  const spotsLeft = event.capacity > 0 ? event.capacity - (event.registrations ?? 0) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        {/* Event header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl overflow-hidden mb-6 ${getBannerGradient(event)}`}
        >
          <div className="p-8 text-white">
            <div className="text-5xl mb-4">{event.emoji ?? '📅'}</div>
            <StatusBadge status={event.status} />
            <h1 className="text-3xl font-extrabold mt-3">{event.title}</h1>
            <p className="text-white/80 mt-2 text-sm leading-relaxed">{event.description}</p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/80">
              <span className="flex items-center gap-1.5"><Calendar size={14} />{formatDate(event.date, 'PPP')}, {event.time}</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} />{event.venue}</span>
              {spotsLeft !== null && <span className="flex items-center gap-1.5"><Users size={14} />{spotsLeft} spots left</span>}
            </div>
          </div>
        </motion.div>

        {/* Share link */}
        <div className="flex items-center gap-2 mb-6 p-3 glass-card bg-white dark:bg-slate-900/80 rounded-xl">
          <Globe size={14} className="text-slate-400 flex-shrink-0" />
          <p className="text-xs text-slate-500 truncate flex-1">{shareUrl}</p>
          <button onClick={() => { copy(shareUrl); toast.success('Link copied!'); }} className="text-primary-600 dark:text-primary-400 hover:underline text-xs font-medium flex items-center gap-1 flex-shrink-0">
            <Copy size={12} /> Copy
          </button>
        </div>

        {/* Closed / full notice */}
        {event.status !== 'open' && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl mb-6 text-center">
            <AlertCircle size={24} className="mx-auto text-amber-500 mb-2" />
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              {event.status === 'closed' ? 'Registration is closed for this event.' : 'This event is not yet open for registration.'}
            </p>
          </div>
        )}

        {/* Success screen */}
        {success ? (
          <div className="glass-card bg-white dark:bg-slate-900/80 rounded-3xl p-8">
            <SuccessScreen registrationId={success.registrationId} event={event} participant={success} />
          </div>
        ) : (
          <AnimatePresence>
            {event.status === 'open' && (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="glass-card bg-white dark:bg-slate-900/80 rounded-3xl p-8 space-y-5"
              >
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Registration Form</h2>

                {/* Core fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Full Name" required placeholder="Aarav Sharma" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
                  <Input label="Email" type="email" required placeholder="aarav@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} error={errors.email} />
                  <Input label="Phone" type="tel" placeholder="9876543210" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} error={errors.phone} />
                  <Input label="College / Organization" required placeholder="IIT Bombay" value={form.college} onChange={(e) => setForm((f) => ({ ...f, college: e.target.value }))} error={errors.college} />
                  <Input label="Department" placeholder="Computer Science" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
                  <Select label="Year / Designation" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}>
                    <option value="">Select year</option>
                    {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'Faculty', 'Professional'].map((y) => <option key={y}>{y}</option>)}
                  </Select>
                </div>

                {/* Custom fields */}
                {event.customFields?.length > 0 && (
                  <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Additional Information</p>
                    {event.customFields.map((field) => (
                      <div key={field.id}>
                        <CustomFieldInput
                          field={field}
                          value={customValues[field.id]}
                          onChange={(v) => setCustomValues((cv) => ({ ...cv, [field.id]: v }))}
                        />
                        {errors[`custom_${field.id}`] && <p className="text-xs text-red-500 mt-1">{errors[`custom_${field.id}`]}</p>}
                      </div>
                    ))}
                  </div>
                )}

                <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
                  Complete Registration
                </Button>

                <p className="text-xs text-slate-400 text-center">
                  By registering, you agree to share your information with the event organizers.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
