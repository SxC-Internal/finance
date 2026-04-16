'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${variant === 'compact' ? 'py-12' : 'py-16'}`}>
      <div className="mb-4 p-4 rounded-full bg-slate-100 dark:bg-slate-800">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-[#071838] hover:bg-[#0a2353] text-white">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
