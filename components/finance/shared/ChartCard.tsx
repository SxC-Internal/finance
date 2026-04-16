'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onExport?: () => void;
  actions?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  children,
  onExport,
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
          <div className="flex items-center gap-2">
            {actions}
            {onExport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExport}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <Download size={16} />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => window.print()}>Print</DropdownMenuItem>
                <DropdownMenuItem onClick={() => alert('Export to PNG coming soon')}>
                  Export PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => alert('Export CSV coming soon')}>
                  Export CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className={isLoading ? 'animate-pulse' : ''}>
        {isLoading ? (
          // Skeleton placeholder for chart
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
