'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { formatIDR } from '@/lib/finance';
import type { BalanceTrendDatum } from '@/lib/finance';

interface BalanceTrendChartProps {
  data: BalanceTrendDatum[];
  isMobile?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className={`text-sm font-bold ${value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
        {formatIDR(value)}
      </p>
    </div>
  );
};

const BalanceTrendChart: React.FC<BalanceTrendChartProps> = ({ data, isMobile = false }) => {
  return (
    <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
      <AreaChart
        data={data}
        margin={isMobile ? { top: 5, right: 5, left: 0, bottom: 30 } : { top: 10, right: 10, left: 10, bottom: 20 }}
      >
        <defs>
          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.03} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-600/50"
        />

        <XAxis
          dataKey="label"
          tick={{ fontSize: isMobile ? 9 : 11, fill: '#94a3b8', fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          angle={isMobile ? -40 : -20}
          textAnchor="end"
          height={isMobile ? 50 : 40}
          interval={0}
        />

        <YAxis
          tickFormatter={(v: number) => {
            if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
            if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
            return String(v);
          }}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={isMobile ? 40 : 55}
        />

        <RechartsTooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
        />

        <Area
          type="monotone"
          dataKey="balance"
          stroke="#3b82f6"
          strokeWidth={2.5}
          fillOpacity={1}
          fill="url(#colorBalance)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default BalanceTrendChart;
