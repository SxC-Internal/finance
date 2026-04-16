'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn('flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm', className)}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
