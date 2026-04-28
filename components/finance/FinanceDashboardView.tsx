'use client';

import React, { lazy, Suspense, useMemo } from 'react';
import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import FinancialStatCard from '@/components/finance/shared/FinancialStatCard';
import FinancePageHeader from '@/components/finance/shared/FinancePageHeader';
import ChartCard from '@/components/finance/shared/ChartCard';
import PendingActionsPanel from '@/components/finance/shared/PendingActionsPanel';
import ActivityFeed from '@/components/finance/shared/ActivityFeed';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import type { User, ActivityFeedItem } from '@/types';
import { USERS } from '@/constants';
import {
  getMonthlyChartData,
  getActivityFeed,
  formatIDR,
} from '@/lib/finance';
import { useCapitalManagement } from '@/hooks/useCapitalManagement';
import { usePendingEmailBlastsCount } from '@/hooks/usePendingEmailBlastsCount';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const RevenueExpensesChart = lazy(
  () => import('@/components/finance/charts/RevenueExpensesChart')
);

interface FinanceDashboardViewProps {
  user: User;
}

const FinanceDashboardView: React.FC<FinanceDashboardViewProps> = ({ user }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  const {
    transactions,
    capitalOverview,
    isManager,
    isLoadingTransactions,
    isLoadingBudgets,
  } = useCapitalManagement(user);

  const { blasts: emailBlasts, pendingCount: pendingBlastsCount } = usePendingEmailBlastsCount(user);

  const monthlyChartData = useMemo(
    () => getMonthlyChartData(transactions, 6),
    [transactions]
  );

  const activities = useMemo<ActivityFeedItem[]>(
    () => getActivityFeed(transactions, emailBlasts, USERS, 10),
    [transactions, emailBlasts]
  );

  const isLoading = isLoadingTransactions || isLoadingBudgets;

  return (
    <div className="space-y-8 animate-fade-in p-4 md:p-6 lg:p-8">
      <FinancePageHeader
        user={user}
        title="Finance Dashboard"
        subtitle={`Welcome back, ${user.name}. Here's your financial overview.`}
        isManager={isManager}
      />

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <FinancialStatCard
          label="Total Income"
          value={capitalOverview.totalIncome}
          formattedValue={formatIDR(capitalOverview.totalIncome)}
          icon={<TrendingUp className="text-emerald-500" size={20} />}
          isLoading={isLoading}
        />
        <FinancialStatCard
          label="Total Expenses"
          value={capitalOverview.totalExpenses}
          formattedValue={formatIDR(capitalOverview.totalExpenses)}
          icon={<TrendingDown className="text-red-500" size={20} />}
          isLoading={isLoading}
        />
        <FinancialStatCard
          label="Net Profit"
          value={capitalOverview.remaining}
          formattedValue={formatIDR(capitalOverview.remaining)}
          icon={<TrendingUp className={capitalOverview.remaining >= 0 ? 'text-emerald-500' : 'text-red-500'} size={20} />}
          isOverBudget={capitalOverview.remaining < 0}
          colorValue={true}
          isLoading={isLoading}
        />
        <FinancialStatCard
          label="Total Allocated"
          value={capitalOverview.totalAllocated}
          formattedValue={formatIDR(capitalOverview.totalAllocated)}
          icon={<PieChart className="text-blue-500" size={20} />}
          isLoading={isLoading}
        />
      </div>

      {/* Monthly Trends Chart */}
      <ChartCard
        title="Revenue vs Expenses (6 Months)"
        description="Monthly income and expense trends"
      >
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueExpensesChart data={monthlyChartData} isMobile={isMobile} />
        </Suspense>
      </ChartCard>

      {/* Pending Actions & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(isManager || pendingBlastsCount > 0) && (
          <div className="lg:col-span-1">
            <PendingActionsPanel pendingEmailBlastsCount={pendingBlastsCount} />
          </div>
        )}
        <div className={pendingBlastsCount > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <ActivityFeed activities={activities} maxItems={12} />
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboardView;
