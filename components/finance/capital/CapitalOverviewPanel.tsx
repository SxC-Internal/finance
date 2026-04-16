'use client'

import React from 'react';
import { TrendingUp, PieChart, ArrowDownCircle, Banknote, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import type { CapitalOverviewWithChange } from '@/lib/finance';
import { formatIDR, formatPercent } from '@/lib/finance';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CapitalOverviewPanelProps {
  capitalOverview: CapitalOverviewWithChange;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  changePercent?: number;
  showChange?: boolean;
  negative?: boolean;
  isOverBudget?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, changePercent, showChange = false, negative = false, isOverBudget = false }) => {
  const trendUp = changePercent && changePercent >= 0;
  const trendColor = isOverBudget ? 'text-red-500' : trendUp ? 'text-emerald-600' : 'text-red-500';
  const trendBgColor = isOverBudget ? 'bg-red-100 dark:bg-red-900/30' : trendUp ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none flex items-center space-x-4">
      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700/50 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">
          {label}
        </p>
        <p
          className={`text-lg font-bold truncate ${negative ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}
        >
          {value}
        </p>
        {showChange && changePercent !== undefined && (
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${trendBgColor} ${trendColor}`}>
                  {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  <span>{formatPercent(changePercent)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{formatPercent(Math.abs(changePercent))} vs last 30 days</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

const CapitalOverviewPanel: React.FC<CapitalOverviewPanelProps> = ({ capitalOverview }) => {
  const {
    totalIncome,
    totalExpenses,
    totalAllocated,
    remaining,
    incomeChangePercent,
    expenseChangePercent,
    averageMonthlyExpenses,
  } = capitalOverview;

  // Calculate cash runway if we have average monthly expenses
  const cashRunwayMonths = averageMonthlyExpenses && averageMonthlyExpenses > 0
    ? Math.round(remaining / averageMonthlyExpenses)
    : null;

  const getRunwayStatus = () => {
    if (cashRunwayMonths === null) return null;
    if (cashRunwayMonths < 3) return { label: 'Critical', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' };
    if (cashRunwayMonths < 6) return { label: 'Warning', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' };
    return { label: 'Healthy', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' };
  };

  const runwayStatus = getRunwayStatus();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Income"
          value={formatIDR(totalIncome)}
          icon={<TrendingUp className="text-emerald-500" size={20} />}
          changePercent={incomeChangePercent}
          showChange={true}
        />
        <StatCard
          label="Total Expenses"
          value={formatIDR(totalExpenses)}
          icon={<ArrowDownCircle className="text-red-500" size={20} />}
          changePercent={expenseChangePercent}
          showChange={true}
        />
        <StatCard
          label="Total Allocated"
          value={formatIDR(totalAllocated)}
          icon={<PieChart className="text-blue-500" size={20} />}
        />
        <StatCard
          label="Remaining Balance"
          value={formatIDR(remaining)}
          icon={<Banknote className={remaining < 0 ? 'text-red-500' : 'text-emerald-500'} size={20} />}
          negative={remaining < 0}
        />
      </div>

      {/* Cash Runway indicator - full width */}
      {cashRunwayMonths !== null && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                <Calendar className={cn("h-5 w-5", runwayStatus?.label === 'Critical' ? 'text-red-500' : runwayStatus?.label === 'Warning' ? 'text-amber-500' : 'text-emerald-500')} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Cash Runway</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {cashRunwayMonths} month{cashRunwayMonths !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {runwayStatus && (
              <span className={cn("text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full", runwayStatus.cls)}>
                {runwayStatus.label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CapitalOverviewPanel;
