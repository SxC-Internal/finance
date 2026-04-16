'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  ArrowDownCircle,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import type { ActivityFeedItem } from '@/types';
import { formatIDR } from '@/lib/finance';

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  maxItems?: number;
  className?: string;
}

const getActivityConfig = (action: ActivityFeedItem['action']) => {
  switch (action) {
    case 'income':
      return {
        icon: <TrendingUp className="text-emerald-500" size={14} />,
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        label: 'Income',
      };
    case 'expense':
      return {
        icon: <ArrowDownCircle className="text-red-500" size={14} />,
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        label: 'Expense',
      };
    case 'blast_sent':
      return {
        icon: <Mail className="text-blue-500" size={14} />,
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        label: 'Blast Sent',
      };
    case 'blast_approved':
      return {
        icon: <CheckCircle className="text-emerald-500" size={14} />,
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        label: 'Blast Approved',
      };
    case 'blast_rejected':
      return {
        icon: <XCircle className="text-red-500" size={14} />,
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        label: 'Blast Rejected',
      };
    case 'budget_allocated':
      return {
        icon: <Clock className="text-blue-500" size={14} />,
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        label: 'Budget Allocated',
      };
    default:
      return {
        icon: <Clock className="text-slate-500" size={14} />,
        color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        label: 'Activity',
      };
  }
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  maxItems = 10,
  className = '',
}) => {
  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 ${className}`}>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity.</p>
      </div>
    );
  }

  // Group activities by date
  const groupedActivities = displayActivities.reduce<
    Record<string, ActivityFeedItem[]>
  >((acc, activity) => {
    const date = new Date(activity.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {});

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 ${className}`}>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
      <div className="space-y-6">
        {Object.entries(groupedActivities).map(([date, dayActivities]) => (
          <div key={date}>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              {date === new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
                ? 'Today'
                : date}
            </p>
            <div className="space-y-3">
              {dayActivities.map((activity) => {
                const config = getActivityConfig(activity.action);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-600">
                      <AvatarImage src={activity.userAvatar} alt={activity.user} />
                      <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {activity.user.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {activity.user}
                        </span>
                        <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${config.color}`}>
                          <span className="flex items-center gap-1">
                            {config.icon}
                            {config.label}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                        {activity.target}
                      </p>
                      {activity.metadata?.amount && (
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {formatIDR(activity.metadata.amount)}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {formatRelativeTime(new Date(activity.timestamp))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
