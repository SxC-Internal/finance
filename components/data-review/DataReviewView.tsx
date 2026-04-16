'use client'

import React from 'react';
import { Search, Filter } from 'lucide-react';
import type { User } from '@/types';
import { useRoleDataReview } from '@/hooks/useRoleDataReview';

interface DataReviewViewProps {
  user: User;
}

const DataReviewView: React.FC<DataReviewViewProps> = ({ user }) => {
  const {
    title,
    subtitle,
    columns,
    rows,
    emptyMessage,
    searchTerm,
    setSearchTerm,
    filterKey,
    filterLabel,
    filterOptions,
    selectedFilter,
    setSelectedFilter,
  } = useRoleDataReview(user);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
        <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search projects, IDs, or owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center space-x-4 w-full md:w-auto">
          {filterKey && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"
                aria-label={filterLabel ?? 'Filter'}
              >
                {filterOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                          ? 'text-center'
                          : ''
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {rows.map((row, idx) => (
                <tr key={String(row.id ?? idx)} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`p-4 text-sm text-slate-700 dark:text-slate-300 ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                            ? 'text-center'
                            : ''
                      }`}
                    >
                      {row[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataReviewView;
