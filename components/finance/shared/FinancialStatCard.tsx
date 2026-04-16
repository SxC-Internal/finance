'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { formatIDR, formatPercent } from '@/lib/finance';

// Counter animation duration
const ANIMATION_DURATION = 1500;

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
}

const FinancialStatCard: React.FC<FinancialStatCardProps> = ({
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
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  const displayValue = formattedValue || formatIDR(value);
  const hasChange = showChange && changePercent !== undefined;
  const isPositive = hasChange && (changePercent >= 0);
  const trendColor = isOverBudget ? 'text-red-500' : isPositive ? 'text-emerald-600' : 'text-red-500';
  const trendBgColor = isOverBudget ? 'bg-red-100 dark:bg-red-900/30' : isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30';

  // Value text color if colorValue is enabled
  const valueColorClass = colorValue
    ? isOverBudget
      ? 'text-red-500'
      : 'text-emerald-600 dark:text-emerald-400'
    : 'text-slate-900 dark:text-white';

  // Number counting animation on mount
  useEffect(() => {
    if (hasAnimated || isLoading) return;

    const startTime = performance.now();
    let animationFrame: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeOut * value);

      setAnimatedValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setAnimatedValue(value);
        setHasAnimated(true);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, hasAnimated, isLoading]);

  // Use animated value unless it's zero (e.g., for loading)
  const finalDisplayValue = hasAnimated ? (formattedValue || formatIDR(animatedValue)) : displayValue;

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none animate-pulse-subtle">
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
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none hover:shadow-md transition-all duration-200 animate-fade-in">
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
          <p className={`text-2xl font-bold ${valueColorClass} animate-count-up leading-tight`}>
            {finalDisplayValue}
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
    </div>
  );
};

export default FinancialStatCard;
