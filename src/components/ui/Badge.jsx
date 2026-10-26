import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  gray: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
};

export default function Badge({ children, variant = 'gray', className = '', dot = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-emerald-500' :
          variant === 'danger' ? 'bg-red-500' :
          variant === 'warning' ? 'bg-amber-500' : 'bg-current'
        }`} />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    open: { variant: 'success', label: 'Open' },
    closed: { variant: 'danger', label: 'Closed' },
    draft: { variant: 'gray', label: 'Draft' },
  };
  const { variant, label } = map[status] ?? { variant: 'gray', label: status };
  return <Badge variant={variant} dot>{label}</Badge>;
}
