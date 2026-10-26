import { Star } from 'lucide-react';
import { useState } from 'react';

export default function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const [hover, setHover] = useState(0);

  const sz = size === 'sm' ? 16 : size === 'lg' ? 28 : 22;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hover || value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            className={`transition-transform ${readOnly ? 'cursor-default' : 'hover:scale-125 cursor-pointer'}`}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(0)}
          >
            <Star
              size={sz}
              className={filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}
            />
          </button>
        );
      })}
    </div>
  );
}
