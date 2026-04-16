'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, FileText, Clock, AlertTriangle } from 'lucide-react';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import EmptyState from './EmptyState';
import type { View } from '@/types';

interface PendingAction {
  id: string;
  type: 'email_blast' | 'expense_approval' | 'budget_review';
  label: string;
  count: number;
  urgency?: 'normal' | 'urgent';
  icon: React.ReactNode;
  view: View;
}

interface PendingActionsPanelProps {
  pendingEmailBlastsCount: number;
  // Future: pendingExpensesCount?: number;
  className?: string;
}

const PendingActionsPanel: React.FC<PendingActionsPanelProps> = ({
  pendingEmailBlastsCount,
  className = '',
}) => {
  const { navigate } = useAppNavigation();

  const actions: PendingAction[] = [
    {
      id: 'approve-email-blasts',
      type: 'email_blast',
      label: 'Approve Email Blasts',
      count: pendingEmailBlastsCount,
      icon: <Mail size={18} />,
      view: 'FINANCE_EMAIL_BLAST' as View,
    },
    // Future: Add expense approval action when implemented
    // {
    //   id: 'review-expenses',
    //   type: 'expense_approval',
    //   label: 'Review Expenses',
    //   count: pendingExpensesCount,
    //   icon: <FileText size={18} />,
    //   view: 'FINANCE_CAPITAL',
    // },
  ];

  const getUrgencyColor = (action: PendingAction) => {
    if (action.urgency === 'urgent') {
      return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
    }
    return 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800';
  };

  const activeActions = actions.filter((a) => a.count > 0);

  if (activeActions.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Clock className="text-slate-400" size={20} />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Pending Actions</h3>
        </div>
        <EmptyState
          icon={<Clock className="text-slate-400" size={24} />}
          title="All caught up!"
          description="No pending actions require your attention right now."
          variant="compact"
        />
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="text-amber-500" size={20} />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Pending Actions</h3>
      </div>
      <div className="space-y-3">
        {activeActions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            className={`w-full justify-start gap-3 h-auto py-3 ${getUrgencyColor(action)} border-2 hover:bg-opacity-80`}
            onClick={() => navigate(action.view)}
          >
            <span className="text-slate-600 dark:text-slate-300">{action.icon}</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {action.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {action.count} pending
              </p>
            </div>
            <Badge
              variant={action.urgency === 'urgent' ? 'destructive' : 'secondary'}
              className="shrink-0"
            >
              {action.count}
            </Badge>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PendingActionsPanel;
