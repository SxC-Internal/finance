'use client';

import React, { useMemo, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DbFinanceTransaction, ExpenseCategory } from '@/types';

interface ExpenseCategoryChartProps {
  expenses: DbFinanceTransaction[];
  height?: number;
}

const CHART_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Marketing: '#3b82f6',
  Operations: '#8b5cf6',
  Venue: '#ec4899',
  Catering: '#f59e0b',
  Equipment: '#10b981',
  Travel: '#06b6d4',
  Other: '#6b7280',
};

const formatIDRShort = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

const ExpenseCategoryChart: React.FC<ExpenseCategoryChartProps> = ({
  expenses,
  height = 250,
}) => {
  const chartData = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach((e) => {
      if (e.type === 'expense') {
        const cat = e.category || 'Other';
        totals[cat] = (totals[cat] || 0) + e.amount;
      }
    });
    return Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
        color: CHART_CATEGORY_COLORS[name as ExpenseCategory] || CHART_CATEGORY_COLORS.Other,
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const renderTooltip = useCallback(
    (props: { active?: boolean; payload?: ReadonlyArray<{ name: string; value: number }> }) => {
      if (!props.active || !props.payload?.length) return null;
      const item = props.payload[0];
      const total = chartData.reduce((s, d) => s + d.value, 0);
      return (
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
          <p className="text-xs font-semibold text-slate-900 dark:text-white">{item.name}</p>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
            {formatIDRShort(item.value)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {((item.value / total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    },
    [chartData]
  );

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        No expense data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => (percent ? `${name} ${(percent * 100).toFixed(0)}%` : name)}
        >
          {chartData.map((entry) => (
            <Cell key={`cell-${entry.name}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={renderTooltip} />
        <Legend
          wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
          formatter={(value) => (
            <span className="text-slate-700 dark:text-slate-300 text-xs">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ExpenseCategoryChart;
