import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950/30',
      secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
      outline: 'border border-slate-700 hover:bg-slate-800/80 text-slate-200',
      ghost: 'hover:bg-slate-800 text-slate-300 hover:text-white',
      destructive: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm',
      success: 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm',
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs rounded-md',
      default: 'h-10 px-4 py-2 text-sm rounded-lg',
      lg: 'h-12 px-6 text-base rounded-xl font-medium',
      icon: 'h-9 w-9 p-0 rounded-lg flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer select-none disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 active:scale-[0.98]',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
