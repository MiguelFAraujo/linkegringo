import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    secondary: 'bg-slate-800 text-slate-300 border-slate-700',
    outline: 'border border-slate-700 text-slate-300 bg-transparent',
    destructive: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    info: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
