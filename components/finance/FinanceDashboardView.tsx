'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, Download, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FinancialStatCard from '@/components/finance/shared/FinancialStatCard';
import ChartCard from '@/components/finance/shared/ChartCard';
import PendingActionsPanel from '@/components/finance/shared/PendingActionsPanel';
import ActivityFeed from '@/components/finance/shared/ActivityFeed';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import type { User, DbEmailBlast, DbFinanceTransaction, DbFinanceProgramBudget, ActivityFeedItem } from '@/types';
import {
  DB_FINANCE_TRANSACTIONS,
  DB_FINANCE_PROGRAM_BUDGETS,
  DB_EMAIL_BLASTS,
  USERS,
} from '@/constants';
import {
  getCapitalOverviewWithChange,
  getMonthlyChartData,
  getActivityFeed,
  formatIDR,
} from '@/lib/finance';
import { useAppNavigation } from '@/hooks/useAppNavigation';

interface FinanceDashboardViewProps {
  user: User;
}

const FinanceDashboardView: React.FC<FinanceDashboardViewProps> = ({ user }) => {
  const { navigate } = useAppNavigation();

  // Get all data needed
  const { transactions, programBudgets } = useMemo(() => {
    return {
      transactions: DB_FINANCE_TRANSACTIONS,
      programBudgets: DB_FINANCE_PROGRAM_BUDGETS,
    };
  }, []);

  // Get email blasts count for pending actions
  const pendingBlastsCount = useMemo(() => {
    return DB_EMAIL_BLASTS.filter((b: any) => b.status === 'pending_approval').length;
  }, []);

  // Overview with change percentages
  const capitalOverview = useMemo(
    () => getCapitalOverviewWithChange(transactions, programBudgets),
    [transactions, programBudgets]
  );

  // Monthly chart data (6 months)
  const monthlyChartData = useMemo(
    () => getMonthlyChartData(transactions, 6),
    [transactions]
  );

  // Activity feed
  const activities = useMemo<ActivityFeedItem[]>(
    () => getActivityFeed(transactions, DB_EMAIL_BLASTS, USERS, 10),
    [transactions, DB_EMAIL_BLASTS]
  );

  // Active programs count
  const activeProgramsCount = programBudgets.length;

  const isManager = useMemo(() => {
    // Check if user is manager (head or manager)
    return user.membershipRole === 'manager' || user.membershipRole === 'head';
  }, [user]);

  // Custom tooltip for charts with improved styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const incomeEntry = payload.find((p: any) => p.dataKey === 'income')
      const expenseEntry = payload.find((p: any) => p.dataKey === 'expenses')

      return (
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl">
          <p className="text-sm font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
            {label}
          </p>
          <div className="space-y-2">
            {incomeEntry && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Income
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {formatIDR(incomeEntry.value)}
                </span>
              </div>
            )}
            {expenseEntry && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Expenses
                </span>
                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                  {formatIDR(expenseEntry.value)}
                </span>
              </div>
            )}
            {incomeEntry && expenseEntry && (
              <div className="flex items-center justify-between gap-4 pt-2 mt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Net</span>
                <span className={`text-xs font-bold ${(incomeEntry.value - expenseEntry.value) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatIDR(incomeEntry.value - expenseEntry.value)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleExport = () => {
    // Prepare CSV data: monthly trends and current overview
    const timestamp = new Date().toISOString().split('T')[0];
    const lines: string[] = [];

    // Section 1: Current Overview
    lines.push('Finance Dashboard Export');
    lines.push(`Export Date,${timestamp}`);
    lines.push('');
    lines.push('Current Overview');
    lines.push('Metric,Value,Change %');
    lines.push(`Total Income,${capitalOverview.totalIncome},${capitalOverview.incomeChangePercent >= 0 ? '+' : ''}${capitalOverview.incomeChangePercent.toFixed(1)}%`);
    lines.push(`Total Expenses,${capitalOverview.totalExpenses},${capitalOverview.expenseChangePercent >= 0 ? '+' : ''}${capitalOverview.expenseChangePercent.toFixed(1)}%`);
    lines.push(`Total Allocated,${capitalOverview.totalAllocated},`);
    lines.push(`Remaining Balance,${capitalOverview.remaining},`);
    lines.push(`Active Programs,${activeProgramsCount},`);
    if (capitalOverview.averageMonthlyExpenses > 0) {
      const runway = Math.round(capitalOverview.remaining / capitalOverview.averageMonthlyExpenses);
      lines.push(`Cash Runway (months),${runway},`);
    }
    lines.push('');
    lines.push('Monthly Trends (6 Months)');
    lines.push('Month,Income,Expenses,Net');
    monthlyChartData.forEach((d) => {
      lines.push(`${d.month},${d.income},${d.expenses},${d.net}`);
    });

    // Create CSV blob
    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `finance-dashboard-export-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-slate-200 dark:border-slate-700">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-[#071838] text-white font-bold text-lg">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Finance Dashboard
              </h1>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-100">
                Active
              </Badge>
              {isManager && (
                <Badge variant="outline" className="border-indigo-500 text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30">
                  Manager Access
                </Badge>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Welcome back, {user.name}. Here&apos;s your financial overview.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-slate-300 dark:border-slate-600" onClick={() => {}}>
            <Calendar className="h-4 w-4" /> Date Range
          </Button>
          {isManager && (
            <Button className="bg-[#071838] hover:bg-[#0a2353] text-white gap-2 shadow-md transition-all" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <FinancialStatCard
          label="Total Income"
          value={capitalOverview.totalIncome}
          formattedValue={formatIDR(capitalOverview.totalIncome)}
          icon={<TrendingUp className="text-emerald-500" size={20} />}
          changePercent={capitalOverview.incomeChangePercent}
          showChange={true}
          trendUp={true}
        />
        <FinancialStatCard
          label="Total Expenses"
          value={capitalOverview.totalExpenses}
          formattedValue={formatIDR(capitalOverview.totalExpenses)}
          icon={<TrendingDown className="text-red-500" size={20} />}
          changePercent={capitalOverview.expenseChangePercent}
          showChange={true}
          trendUp={false}
        />
        <FinancialStatCard
          label="Net Profit"
          value={capitalOverview.remaining}
          formattedValue={formatIDR(capitalOverview.remaining)}
          icon={<TrendingUp className={capitalOverview.remaining >= 0 ? 'text-emerald-500' : 'text-red-500'} size={20} />}
          isOverBudget={capitalOverview.remaining < 0}
          colorValue={true}
        />
        <FinancialStatCard
          label="Active Programs"
          value={activeProgramsCount}
          formattedValue={activeProgramsCount.toString()}
          icon={<Building2 className="text-blue-500" size={20} />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Monthly Trends Chart */}
        <ChartCard
          title="Revenue vs Expenses (6 Months)"
          description="Monthly income and expense trends"
          onExport={handleExport}
        >
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={monthlyChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                {/* Enhanced gradient for income - smoother transition */}
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
                {/* Enhanced gradient for expenses */}
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              {/* Grid lines for better readability */}
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-600/50"
              />

              {/* X-Axis with improved styling */}
              <XAxis
                dataKey="month"
                tick={{
                  fontSize: 13,
                  fill: '#64748b',
                  fontWeight: 500,
                }}
                tickLine={{ stroke: '#cbd5e1' }}
                axisLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
                tickMargin={12}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
              />

              {/* Y-Axis with improved formatting */}
              <YAxis
                tickFormatter={(value) => {
                  if (value >= 10000000) {
                    return `Rp ${(value / 1000000).toFixed(1)}M`
                  } else if (value >= 1000) {
                    return `Rp ${(value / 1000).toFixed(0)}K`
                  }
                  return `Rp ${value}`
                }}
                tick={{
                  fontSize: 12,
                  fill: '#64748b',
                  fontWeight: 500,
                }}
                tickLine={{ stroke: '#cbd5e1' }}
                tickMargin={12}
                width={85}
                axisLine={false}
              />

              <RechartsTooltip
                content={<CustomTooltip />}
                cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
              />

              {/* Income Area with smooth curve */}
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorIncome)"
                animationDuration={1000}
                animationEasing="ease-in-out"
              />

              {/* Expenses Area with smooth curve */}
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#ef4444"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorExpenses)"
                animationDuration={1000}
                animationEasing="ease-in-out"
              />

              {/* Enhanced Legend */}
              <Legend
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
                iconType="circle"
                formatter={(value) => {
                  const color = value === 'Income' ? '#10b981' : '#ef4444'
                  return (
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {value}
                    </span>
                  )
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pending Actions & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Actions - for managers, otherwise hide or show empty state */}
        {(isManager || pendingBlastsCount > 0) && (
          <div className="lg:col-span-1">
            <PendingActionsPanel
              pendingEmailBlastsCount={pendingBlastsCount}
            />
          </div>
        )}

        {/* Recent Activity Feed */}
        <div className={pendingBlastsCount > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <ActivityFeed activities={activities} maxItems={8} />
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboardView;
