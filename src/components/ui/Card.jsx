import { motion } from 'framer-motion';

const cardVariants = {
  default: 'glass-card bg-white dark:bg-slate-900/80',
  glass: 'glass-card',
  elevated: 'bg-white dark:bg-slate-900 shadow-lg border border-slate-100 dark:border-slate-800 rounded-2xl',
  flat: 'bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700',
};

export default function Card({
  children,
  className = '',
  variant = 'default',
  hover = true,
  onClick,
  padding = true,
}) {
  const base = `${cardVariants[variant]} ${padding ? 'p-5' : ''} ${className}`;

  if (hover || onClick) {
    return (
      <motion.div
        className={`${base} ${onClick ? 'cursor-pointer' : ''}`}
        whileHover={hover ? { y: -2, shadow: '0 20px 40px rgba(0,0,0,0.15)' } : {}}
        transition={{ duration: 0.2 }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={base}>{children}</div>;
}

/** Skeleton loading card */
export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="glass-card bg-white dark:bg-slate-900/80 p-5 space-y-3">
      <div className="shimmer h-5 rounded-lg w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`shimmer h-4 rounded-lg ${i % 2 === 0 ? 'w-full' : 'w-5/6'}`} />
      ))}
      <div className="shimmer h-8 rounded-xl w-1/3 mt-4" />
    </div>
  );
}

/** Stat card with icon, title, value, and trend */
export function StatCard({ title, value, icon: Icon, trend, color = 'primary', loading }) {
  const colorMap = {
    primary: { bg: 'bg-primary-100 dark:bg-primary-950', text: 'text-primary-600 dark:text-primary-400' },
    success: { bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-600 dark:text-emerald-400' },
    warning: { bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-600 dark:text-amber-400' },
    danger: { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-600 dark:text-red-400' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-950', text: 'text-purple-600 dark:text-purple-400' },
  };
  const c = colorMap[color] ?? colorMap.primary;

  if (loading) return <SkeletonCard lines={1} />;

  return (
    <motion.div
      className="glass-card bg-white dark:bg-slate-900/80 p-5 stat-card"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          {trend !== undefined && (
            <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
            </p>
          )}
        </div>
        {Icon && (
          <div className={`${c.bg} ${c.text} p-3 rounded-xl`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
