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
      role="tablist"
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-xl bg-[#090D14] p-1 border border-[#1E293B] text-slate-400',
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
      role="tab"
      aria-selected={isSelected}
      data-state={isSelected ? 'active' : 'inactive'}
      onClick={() => context.onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-xs sm:text-sm font-medium transition-all cursor-pointer select-none',
        isSelected
          ? 'bg-slate-800 text-white shadow-sm font-semibold border border-slate-700/60'
          : 'hover:text-slate-200 hover:bg-slate-800/40',
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
  forceMount,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string; forceMount?: boolean }) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  const isSelected = context.value === value;
  if (!isSelected && !forceMount) return null;

  return (
    <div
      className={cn('mt-4 focus-visible:outline-none', !isSelected && 'hidden', className)}
      hidden={!isSelected}
      {...props}
    >
      {children}
    </div>
  );
}
