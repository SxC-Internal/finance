'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const TooltipContext = React.createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null);

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export const Tooltip: React.FC<{ children: React.ReactNode; delayDuration?: number }> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      {children}
    </TooltipContext.Provider>
  );
};

export const TooltipTrigger = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { asChild?: boolean }>(
  ({ children, asChild, ...props }, ref) => {
    const { setOpen } = React.useContext(TooltipContext)!;
    return (
      <span
        ref={ref}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

export const TooltipContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const { open } = React.useContext(TooltipContext)!;
  if (!open) return null;
  return (
    <div className={cn(
      'fixed top-0 left-0 z-50 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg text-slate-900 dark:text-white',
      className
    )}>
      {children}
    </div>
  );
};
