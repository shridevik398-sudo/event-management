import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';

export function formatDate(dateStr, fmt = 'PPP') {
  if (!dateStr) return '—';
  try {
    return format(typeof dateStr === 'string' ? parseISO(dateStr) : dateStr, fmt);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr) {
  return formatDate(dateStr, 'PPp');
}

export function formatRelative(dateStr) {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(typeof dateStr === 'string' ? parseISO(dateStr) : dateStr, { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function isUpcoming(dateStr) {
  if (!dateStr) return false;
  return isAfter(typeof dateStr === 'string' ? parseISO(dateStr) : dateStr, new Date());
}

export function isPast(dateStr) {
  if (!dateStr) return false;
  return isBefore(typeof dateStr === 'string' ? parseISO(dateStr) : dateStr, new Date());
}

export function getStatusBadgeClass(status) {
  const map = {
    open: 'badge-success',
    closed: 'badge-danger',
    draft: 'badge-gray',
  };
  return map[status] ?? 'badge-gray';
}

export function getCategoryColor(category) {
  const map = {
    Technology: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    Cultural: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    Hackathon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    Workshop: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    Business: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    Sports: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
    Academic: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    Social: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  };
  return map[category] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

export function getBannerGradient(event) {
  if (event?.bannerColor) return `bg-gradient-to-br ${event.bannerColor}`;
  const gradients = [
    'from-blue-600 to-cyan-500',
    'from-purple-600 to-pink-500',
    'from-emerald-600 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-600',
    'from-indigo-600 to-violet-500',
  ];
  const idx = event?.title ? event.title.charCodeAt(0) % gradients.length : 0;
  return `bg-gradient-to-br ${gradients[idx]}`;
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone?.replace(/\s+/g, ''));
}

export function truncate(str, len = 60) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}
