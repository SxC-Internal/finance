'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Download, Archive, Copy, RefreshCw, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { DbEmailBlast, DbEmailBlastRecipient, EmailBlastStatus } from '@/types';
import { useToast } from '@/components/shared/ToastProvider';
import EmptyState from '../shared/EmptyState';
import { Mail } from 'lucide-react';

interface BlastHistoryTableProps {
  blasts: DbEmailBlast[];
  getRecipientsForBlast: (blastId: string) => DbEmailBlastRecipient[];
  onResend?: (blast: DbEmailBlast) => void;
  onDuplicate?: (blast: DbEmailBlast) => void;
  onArchive?: (blastId: string) => void;
}

const STATUS_CONFIG: Record<EmailBlastStatus, { label: string; cls: string }> = {
  sent: {
    label: 'Sent',
    cls: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  },
  approved: {
    label: 'Approved',
    cls: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  },
  pending_approval: {
    label: 'Pending',
    cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  },
  rejected: {
    label: 'Rejected',
    cls: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  },
  draft: {
    label: 'Draft',
    cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  },
};

type SortField = 'subject' | 'createdAt' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortHeaderProps {
  field: SortField;
  children: React.ReactNode;
  className?: string;
  activeSortField: SortField;
  activeSortDir: SortDirection;
  onSort: (field: SortField) => void;
}

const SortHeader: React.FC<SortHeaderProps> = ({ field, children, className = '', activeSortField, activeSortDir, onSort }) => (
  <button
    type="button"
    onClick={() => onSort(field)}
    className={cn('flex items-center gap-1', className)}
  >
    {children}
    {activeSortField === field ? (
      activeSortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
    ) : (
      <ChevronDown size={14} className="opacity-30" />
    )}
  </button>
);
SortHeader.displayName = 'SortHeader';

const BlastHistoryTable: React.FC<BlastHistoryTableProps> = ({
  blasts,
  getRecipientsForBlast,
  onResend,
  onDuplicate,
  onArchive,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmailBlastStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [rowHover, setRowHover] = useState<string | null>(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const { addToast } = useToast();

  // Filter and sort logic
  const filteredAndSortedBlasts = useMemo(() => {
    let result = [...blasts];

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }

    // Search in subject and body
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.subject.toLowerCase().includes(query) ||
          b.body.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'subject':
          cmp = a.subject.localeCompare(b.subject);
          break;
        case 'createdAt':
          cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [blasts, statusFilter, searchQuery, sortField, sortDir]);

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['Subject', 'Status', 'Sent Date', 'Recipients'];
    const rows = filteredAndSortedBlasts.map((blast) => {
      const recipients = getRecipientsForBlast(blast.id).length;
      return [
        `"${blast.subject.replace(/"/g, '""')}"`,
        STATUS_CONFIG[blast.status]?.label || blast.status,
        blast.sentAt ? blast.sentAt.split('T')[0] : '-',
        recipients.toString(),
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `blast-metrics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/40">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search blasts..."
            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <span>Status: {statusFilter === 'all' ? 'All' : STATUS_CONFIG[statusFilter].label}</span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <DropdownMenuItem key={key} onClick={() => setStatusFilter(key as EmailBlastStatus)}>
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          <Button variant="outline" size="sm" className="gap-2 h-9" onClick={handleExport} disabled={filteredAndSortedBlasts.length === 0}>
            <Download size={14} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table - responsive horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/40 text-xs">
          <SortHeader field="subject" className="flex-1 min-w-0 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider" activeSortField={sortField} activeSortDir={sortDir} onSort={handleSort}>
            Subject
          </SortHeader>
          <SortHeader field="status" className="shrink-0 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24" activeSortField={sortField} activeSortDir={sortDir} onSort={handleSort}>
            Status
          </SortHeader>
          <SortHeader field="createdAt" className="shrink-0 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24 text-right" activeSortField={sortField} activeSortDir={sortDir} onSort={handleSort}>
            Date
          </SortHeader>
          <span className="shrink-0 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs w-20 text-right">Recipients</span>
          <span className="w-10" />
        </div>

        {filteredAndSortedBlasts.length === 0 ? (
          <EmptyState
            icon={<Mail className="text-slate-400" size={24} />}
            title="No blasts found"
            description="Try adjusting your search or filter criteria."
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filteredAndSortedBlasts.map((blast) => (
              <div
                key={blast.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 relative group transition-all',
                  rowHover === blast.id && 'bg-slate-50 dark:bg-slate-700/30'
                )}
                onMouseEnter={() => setRowHover(blast.id)}
                onMouseLeave={() => setRowHover(null)}
              >
                {/* Subject */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {blast.subject}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {blast.createdAt.split('T')[0]}
                  </p>
                </div>

                {/* Status badge */}
                <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_CONFIG[blast.status]?.cls || STATUS_CONFIG.draft.cls}`}>
                  {STATUS_CONFIG[blast.status]?.label || blast.status}
                </span>

                {/* Recipients count */}
                <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400 w-20 text-right font-medium">
                  {getRecipientsForBlast(blast.id).length} recip.
                </span>

                {/* Row actions */}
                <div
                  className={cn(
                    'w-10 flex items-center justify-center transition-opacity',
                    rowHover === blast.id ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                        <MoreHorizontal size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {blast.status === 'sent' && onResend && (
                        <DropdownMenuItem
                          onClick={() => {
                            onResend(blast);
                            addToast({
                              type: 'success',
                              title: 'Blast Resent',
                              message: `"${blast.subject}" has been resent to all recipients.`,
                            });
                          }}
                        >
                          <RefreshCw size={14} className="mr-2" />
                          Resend
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          onDuplicate?.(blast);
                          addToast({
                            type: 'success',
                            title: 'Blast Duplicated',
                            message: `A draft copy of "${blast.subject}" has been created.`,
                          });
                        }}
                      >
                        <Copy size={14} className="mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      {onArchive && (
                        <DropdownMenuItem
                          onClick={() => setArchiveConfirmId(blast.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Archive size={14} className="mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archive confirmation dialog */}
      <AlertDialog open={!!archiveConfirmId} onOpenChange={(open) => !open && setArchiveConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Blast</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this email blast? Archived blasts can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (archiveConfirmId) {
                  onArchive?.(archiveConfirmId);
                  addToast({
                    type: 'success',
                    title: 'Blast Archived',
                    message: 'The email blast has been archived.',
                  });
                  setArchiveConfirmId(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlastHistoryTable;
