'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollText, Wallet, Upload, Download } from 'lucide-react';

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  visible?: boolean;
}

interface ActionToolbarProps {
  actions: ActionItem[];
  className?: string;
}

const ActionToolbar: React.FC<ActionToolbarProps> = ({ actions, className = '' }) => {
  const visibleActions = actions.filter((action) => action.visible !== false);

  if (visibleActions.length === 0) return null;

  return (
    <div className={`sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 py-3 px-4 mb-6 ${className}`}>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {visibleActions.map((action) => (
          <Button
            key={action.id}
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className="flex items-center gap-2 whitespace-nowrap shadow-sm"
          >
            {action.icon}
            <span>{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ActionToolbar;
