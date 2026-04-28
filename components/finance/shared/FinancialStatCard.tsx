'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { formatIDR, formatPercent } from '@/lib/finance';

interface ChartDataPoint {
  value: number;
}

interface FinancialStatCardProps {
  label: string;
  value: number;
  formattedValue?: string;
  icon: React.ReactNode;
  changePercent?: number;
  showChange?: boolean;
  trendUp?: boolean;
  isOverBudget?: boolean;
  colorValue?: boolean; // Apply green/red coloring to the main value based on isOverBudget/trendUp
  isLoading?: boolean;
  sparklineData?: ChartDataPoint[]; // 6-month trend data for mini chart
}

const FinancialStatCard = React.memo(function FinancialStatCard({
  label,
  value,
  formattedValue,
  icon,
  changePercent,
  showChange = false,
  trendUp = true,
  isOverBudget = false,
  colorValue = false,
  isLoading = false,
  sparklineData,
}: FinancialStatCardProps) {
  const displayValue = formattedValue || formatIDR(value);
  const hasChange = showChange && changePercent !== undefined;
  const isPositive = hasChange && (changePercent >= 0);
  const trendColor = isOverBudget ? 'text-red-500' : isPositive ? 'text-emerald-600' : 'text-red-500';
  const trendBgColor = isOverBudget ? 'bg-red-100 dark:bg-red-900/30' : isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30';

  const valueColorClass = colorValue
    ? isOverBudget
      ? 'text-red-500'
      : 'text-emerald-600 dark:text-emerald-400'
    : 'text-slate-900 dark:text-white';

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="flex-1">
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/50 shrink-0">
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1.5">
              {label}
            </p>
            <p className={`text-xl font-bold leading-tight break-all ${valueColorClass}`}>
              {displayValue}
            </p>
            {hasChange && (
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${trendBgColor} ${trendColor}`}>
                      {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
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

        {/* Sparkline Chart */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-2 -mx-5 px-5">
            <ResponsiveContainer width="100%" height={40}>
              <AreaChart data={sparklineData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id={`sparkline-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={trendUp ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={trendUp ? '#10b981' : '#ef4444'} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={trendUp ? '#10b981' : '#ef4444'}
                  strokeWidth={1.5}
                  fill={`url(#sparkline-${label})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
});

export default FinancialStatCard;
