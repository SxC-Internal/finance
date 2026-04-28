'use client';

import React from 'react';
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
import { formatIDR } from '@/lib/finance';

interface MonthlyDataPoint {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface RevenueExpensesChartProps {
  data: MonthlyDataPoint[];
  isMobile: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const incomeEntry = payload.find((p) => p.dataKey === 'income');
  const expenseEntry = payload.find((p) => p.dataKey === 'expenses');

  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl">
      <p className="text-sm font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
        {label}
      </p>
      <div className="space-y-2">
        {incomeEntry && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
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
              <span className="w-2 h-2 rounded-full bg-red-500" />
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
            <span
              className={`text-xs font-bold ${
                incomeEntry.value - expenseEntry.value >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatIDR(incomeEntry.value - expenseEntry.value)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const RevenueExpensesChart: React.FC<RevenueExpensesChartProps> = ({ data, isMobile }) => {
  return (
    <ResponsiveContainer width="100%" height={isMobile ? 280 : 320}>
      <AreaChart
        data={data}
        margin={
          isMobile
            ? { top: 10, right: 10, left: 0, bottom: 50 }
            : { top: 20, right: 30, left: 20, bottom: 20 }
        }
      >
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="50%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
            <stop offset="50%" stopColor="#ef4444" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-600/50"
        />

        <XAxis
          dataKey="month"
          tick={{ fontSize: isMobile ? 10 : 13, fill: '#64748b', fontWeight: 500 }}
          tickLine={{ stroke: '#cbd5e1' }}
          axisLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
          tickMargin={isMobile ? 5 : 12}
          interval={isMobile ? 1 : 0}
          angle={isMobile ? -45 : -15}
          textAnchor="end"
          height={isMobile ? 70 : 60}
        />

        <YAxis
          tickFormatter={(value: number) => {
            if (value >= 10_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
            if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}K`;
            return `Rp ${value}`;
          }}
          tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b', fontWeight: 500 }}
          tickLine={{ stroke: '#cbd5e1' }}
          tickMargin={8}
          width={isMobile ? 50 : 85}
          axisLine={false}
        />

        <RechartsTooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
        />

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

        <Legend
          wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 500 }}
          iconType="circle"
          formatter={(value) => (
            <span className="text-slate-800 dark:text-slate-200 font-medium">{value}</span>
          )}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueExpensesChart;
