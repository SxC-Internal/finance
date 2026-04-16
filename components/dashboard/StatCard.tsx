"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { StatMetric } from "@/types";
import { DEFAULT_METRIC_ICON, METRIC_ICONS } from "@/lib/metrics";

interface StatCardProps {
  metric: StatMetric;
  deptId?: string;
}

const StatCard: React.FC<StatCardProps> = ({ metric }) => {
  const Icon = METRIC_ICONS[metric.icon] ?? DEFAULT_METRIC_ICON;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all duration-300 shadow-sm dark:shadow-lg dark:shadow-black/20 group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-slate-700 transition-colors">
          <Icon className="text-blue-500 dark:text-blue-400" size={24} />
        </div>
        <div
          className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
            metric.trendUp
              ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
          }`}
        >
          {metric.trendUp ? (
            <TrendingUp size={12} className="mr-1" />
          ) : (
            <TrendingDown size={12} className="mr-1" />
          )}
          {metric.trend}
        </div>
      </div>
      <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
        {metric.label}
      </h3>
      <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
        {metric.value}
      </p>
    </div>
  );
};

export default StatCard;
