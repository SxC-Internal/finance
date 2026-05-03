'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/types';

interface FinancePageHeaderProps {
  user: User;
  title: string;
  subtitle: string;
  isManager?: boolean;
  roleBadgeLabel?: string;
  actions?: React.ReactNode;
}

const FinancePageHeader: React.FC<FinancePageHeaderProps> = ({
  user,
  title,
  subtitle,
  actions,
}) => {
  return (
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
              {title}
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default FinancePageHeader;
