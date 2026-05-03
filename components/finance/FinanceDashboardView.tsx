'use client';

import React, { lazy, Suspense, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import PendingActionsPanel from '@/components/finance/shared/PendingActionsPanel';
import ActivityFeed from '@/components/finance/shared/ActivityFeed';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import type { User, ActivityFeedItem } from '@/types';
import { DB_USERS } from '@/constants';
import {
  getBalanceTrendData,
  getActivityFeed,
  formatIDR,
  formatPercent,
  type BalanceTrendPeriod,
} from '@/lib/finance';
import { useCapitalManagement } from '@/hooks/useCapitalManagement';
import { usePendingEmailBlastsCount } from '@/hooks/usePendingEmailBlastsCount';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const BalanceTrendChart = lazy(
  () => import('@/components/finance/charts/BalanceTrendChart')
);

interface FinanceDashboardViewProps {
  user: User;
}

const PERIODS: { key: BalanceTrendPeriod; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const FinanceDashboardView: React.FC<FinanceDashboardViewProps> = ({ user }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [period, setPeriod] = useState<BalanceTrendPeriod>('monthly');

  const {
    transactions,
    capitalOverview,
    isManager,
    isLoadingTransactions,
    isLoadingBudgets,
  } = useCapitalManagement(user);

  const { blasts: emailBlasts, pendingCount: pendingBlastsCount } = usePendingEmailBlastsCount(user);

  const balanceTrendData = useMemo(
    () => getBalanceTrendData(transactions, period),
    [transactions, period]
  );

  const activities = useMemo<ActivityFeedItem[]>(
    () => getActivityFeed(transactions, emailBlasts, DB_USERS, 10),
    [transactions, emailBlasts]
  );

  const isLoading = isLoadingTransactions || isLoadingBudgets;
  const totalBalance = capitalOverview.totalIncome - capitalOverview.totalExpenses;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">

      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 p-6 md:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Welcome back, {user.name.split(' ')[0]}.
            </h1>
            <p className="mt-1 text-blue-100 text-sm md:text-base">
              Here&apos;s your SxC Finance overview.
            </p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-blue-200 text-xs uppercase tracking-widest font-semibold">
              SxC Finance
            </p>
            <p className="text-white/60 text-xs mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Balance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left: Total Balance + Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Total Balance
              </p>
              {isLoading ? (
                <div className="h-9 w-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg mt-1" />
              ) : (
                <p className={`text-3xl md:text-4xl font-bold mt-1 ${totalBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                  {formatIDR(totalBalance)}
                </p>
              )}
            </div>

            {/* Period Toggle */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden self-start">
              {PERIODS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                    period === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Suspense fallback={<ChartSkeleton />}>
            <BalanceTrendChart data={balanceTrendData} isMobile={isMobile} />
          </Suspense>
        </div>

        {/* Right: Income + Expense mini-cards */}
        <div className="flex flex-col gap-4">

          {/* Income */}
          <div className="flex-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Total Income
              </p>
              {!isLoading && (
                <span className={`flex items-center justify-center w-8 h-8 rounded-full ${capitalOverview.incomeChangePercent >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                  {capitalOverview.incomeChangePercent >= 0
                    ? <TrendingUp className="text-emerald-500" size={16} />
                    : <TrendingDown className="text-red-500" size={16} />
                  }
                </span>
              )}
            </div>
            {isLoading ? (
              <div className="h-7 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
            ) : (
              <>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatIDR(capitalOverview.totalIncome)}
                </p>
                <p className={`mt-1 text-xs font-semibold ${capitalOverview.incomeChangePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {formatPercent(capitalOverview.incomeChangePercent)} vs last month
                </p>
              </>
            )}
          </div>

          {/* Expense */}
          <div className="flex-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Total Expenses
              </p>
              {!isLoading && (
                <span className={`flex items-center justify-center w-8 h-8 rounded-full ${capitalOverview.expenseChangePercent <= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                  {capitalOverview.expenseChangePercent <= 0
                    ? <TrendingDown className="text-emerald-500" size={16} />
                    : <TrendingUp className="text-red-500" size={16} />
                  }
                </span>
              )}
            </div>
            {isLoading ? (
              <div className="h-7 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
            ) : (
              <>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatIDR(capitalOverview.totalExpenses)}
                </p>
                <p className={`mt-1 text-xs font-semibold ${capitalOverview.expenseChangePercent <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {formatPercent(capitalOverview.expenseChangePercent)} vs last month
                </p>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Pending Actions & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(isManager || pendingBlastsCount > 0) && (
          <div className="lg:col-span-1">
            <PendingActionsPanel pendingEmailBlastsCount={pendingBlastsCount} />
          </div>
        )}
        <div className={(isManager || pendingBlastsCount > 0) ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <ActivityFeed activities={activities} maxItems={12} />
        </div>
      </div>

    </div>
  );
};

export default FinanceDashboardView;
