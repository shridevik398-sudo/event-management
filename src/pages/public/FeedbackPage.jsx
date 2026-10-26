import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, CheckCircle, AlertCircle } from 'lucide-react';
import { useAsync } from '../../hooks';
import { getEvent, addFeedback } from '../../services/dataService';
import { getBannerGradient, formatDate } from '../../utils/helpers';
import Button from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import StarRating from '../../components/ui/StarRating';
import Navbar from '../../components/layout/Navbar';
import toast from 'react-hot-toast';

export default function FeedbackPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { data: event, loading } = useAsync(() => getEvent(eventId), [eventId]);

  const [form, setForm] = useState({ name: '', rating: 0, liked: '', suggestions: '', isAnonymous: false });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.rating) e.rating = 'Please select a rating';
    if (!form.liked.trim()) e.liked = 'Please tell us what you liked';
    if (!form.isAnonymous && !form.name.trim()) e.name = 'Please enter your name or submit anonymously';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await addFeedback({
        eventId,
        participantName: form.isAnonymous ? 'Anonymous' : form.name,
        isAnonymous: form.isAnonymous,
        rating: form.rating,
        liked: form.liked,
        suggestions: form.suggestions,
      });
      setSubmitted(true);
      toast.success('Feedback submitted!');
    } catch (e) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
        <p className="text-slate-600 dark:text-slate-300">Event not found.</p>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/')}>Go Home</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 pt-24 pb-16">
        {/* Banner */}
        <div className={`rounded-3xl overflow-hidden mb-6 ${getBannerGradient(event)}`}>
          <div className="p-6 text-white">
            <div className="text-4xl mb-3">{event.emoji ?? '📅'}</div>
            <h1 className="text-2xl font-extrabold">{event.title}</h1>
            <p className="text-white/70 text-sm mt-1">{formatDate(event.date, 'PPP')}</p>
          </div>
        </div>

        {submitted ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center shadow-xl space-y-4"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Thank You!</h2>
            <p className="text-slate-500 dark:text-slate-400">Your feedback helps us improve future events.</p>
            <Button variant="primary" size="lg" onClick={() => navigate('/')}>Back to Home</Button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl space-y-6"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Share Your Feedback</h2>

            {/* Anonymous toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Submit anonymously</label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isAnonymous: !f.isAnonymous }))}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.isAnonymous ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${form.isAnonymous ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Name (shown when not anonymous) */}
            {!form.isAnonymous && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Your Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Aarav Sharma"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
            )}

            {/* Star rating */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Overall Rating <span className="text-red-500">*</span>
              </label>
              <StarRating value={form.rating} onChange={(r) => setForm((f) => ({ ...f, rating: r }))} size="lg" />
              {errors.rating && <p className="text-xs text-red-500 mt-1">{errors.rating}</p>}
              <p className="text-xs text-slate-400 mt-1">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][form.rating] || 'Select a rating'}
              </p>
            </div>

            {/* What you liked */}
            <Textarea
              label="What did you like most?"
              required
              placeholder="The workshops were amazing, especially the hands-on sessions..."
              value={form.liked}
              onChange={(e) => setForm((f) => ({ ...f, liked: e.target.value }))}
              error={errors.liked}
              rows={3}
            />

            {/* Suggestions */}
            <Textarea
              label="Any suggestions for improvement?"
              placeholder="More networking time would be great..."
              value={form.suggestions}
              onChange={(e) => setForm((f) => ({ ...f, suggestions: e.target.value }))}
              rows={3}
            />

            <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
              Submit Feedback
            </Button>
          </motion.form>
        )}
      </div>
    </div>
  );
}
