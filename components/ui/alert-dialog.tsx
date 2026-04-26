'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Simple modal implementation with Radix-like pattern
interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface AlertDialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface AlertDialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface AlertDialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

interface AlertDialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface AlertDialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

// Context for dialog
const AlertDialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

// Main AlertDialog wrapper
export const AlertDialog: React.FC<AlertDialogProps> & {
  Content: React.FC<AlertDialogContentProps>;
  Header: React.FC<AlertDialogHeaderProps>;
  Footer: React.FC<AlertDialogFooterProps>;
  Title: React.FC<AlertDialogTitleProps>;
  Description: React.FC<AlertDialogDescriptionProps>;
  Action: React.FC<AlertDialogActionProps>;
  Cancel: React.FC<AlertDialogCancelProps>;
} = ({ open, onOpenChange, children }) => {
  // Handle escape key and backdrop click
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="presentation"
        onKeyDown={handleKeyDown}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
          aria-hidden="true"
          onClick={() => onOpenChange(false)}
        />
        {/* Content */}
        <div
          className={cn(
            'relative z-10 w-full max-w-lg animate-scale-in',
            'bg-white dark:bg-slate-800 rounded-xl shadow-2xl',
            'border border-slate-200 dark:border-slate-700'
          )}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </AlertDialogContext.Provider>
  );
};

AlertDialog.Content = ({ className, children }) => (
  <div className={cn('p-6', className)}>{children}</div>
);
AlertDialog.Content.displayName = 'AlertDialogContent';

AlertDialog.Header = ({ className, children }) => (
  <div className={cn('mb-4', className)}>{children}</div>
);
AlertDialog.Header.displayName = 'AlertDialogHeader';

AlertDialog.Footer = ({ className, children }) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700',
      className
    )}
  >
    {children}
  </div>
);
AlertDialog.Footer.displayName = 'AlertDialogFooter';

AlertDialog.Title = ({ className, children }) => (
  <h2
    className={cn(
      'text-lg font-semibold text-slate-900 dark:text-white',
      className
    )}
  >
    {children}
  </h2>
);
AlertDialog.Title.displayName = 'AlertDialogTitle';

AlertDialog.Description = ({ className, children }) => (
  <p className={cn('text-sm text-slate-500 dark:text-slate-400 mt-2', className)}>
    {children}
  </p>
);
AlertDialog.Description.displayName = 'AlertDialogDescription';

AlertDialog.Action = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext);
    if (!context) throw new Error('AlertDialog.Action must be used within AlertDialog');

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      context.onOpenChange(false);
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg',
          'bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);
AlertDialog.Action.displayName = 'AlertDialogAction';

AlertDialog.Cancel = React.forwardRef<HTMLButtonElement, AlertDialogCancelProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext);
    if (!context) throw new Error('AlertDialog.Cancel must be used within AlertDialog');

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      context.onOpenChange(false);
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg',
          'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600',
          'hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);
AlertDialog.Cancel.displayName = 'AlertDialogCancel';

AlertDialog.displayName = 'AlertDialog';

// Export sub-components as named exports (shadcn/ui pattern)
export const AlertDialogContent = AlertDialog.Content;
export const AlertDialogHeader = AlertDialog.Header;
export const AlertDialogFooter = AlertDialog.Footer;
export const AlertDialogTitle = AlertDialog.Title;
export const AlertDialogDescription = AlertDialog.Description;
export const AlertDialogAction = AlertDialog.Action;
export const AlertDialogCancel = AlertDialog.Cancel;
