import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export function Tabs({
  value,
  onValueChange,
  defaultValue,
  children,
  className,
}: {
  value?: string;
  onValueChange?: (val: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [current, setCurrent] = React.useState(defaultValue || '');
  const activeValue = value !== undefined ? value : current;
  const setActiveValue = onValueChange !== undefined ? onValueChange : setCurrent;

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: setActiveValue }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-xl bg-slate-900/90 p-1 border border-slate-800 text-slate-400',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isSelected = context.value === value;

  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-all cursor-pointer',
        isSelected
          ? 'bg-emerald-600 text-white shadow-sm font-semibold'
          : 'hover:text-slate-200 hover:bg-slate-800/60',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return (
    <div className={cn('mt-4 focus-visible:outline-none', className)} {...props}>
      {children}
    </div>
  );
}
