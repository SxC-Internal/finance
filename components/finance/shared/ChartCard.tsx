'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  children,
  actions,
  className = '',
  isLoading = false,
}) => {
  return (
    <Card className={`bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-200 hover-lift ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={isLoading ? 'animate-pulse' : ''}>
        {isLoading ? (
          <div className="h-64 bg-slate-100 dark:bg-slate-700/50 rounded-lg flex items-center justify-center">
            <div className="text-slate-400 dark:text-slate-500 text-sm">Loading chart...</div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
