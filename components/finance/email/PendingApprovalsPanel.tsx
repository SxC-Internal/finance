'use client';

import React, { useState, useMemo } from 'react';
import { CheckCircle, XCircle, AlertTriangle, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useToast } from '@/components/shared/ToastProvider';
import EmptyState from '../shared/EmptyState';
import type { DbEmailBlast, DbEmailBlastRecipient, User } from '@/types';
import { USERS } from '@/constants';

interface PendingApprovalsPanelProps {
  pendingBlasts: DbEmailBlast[];
  isManager: boolean;
  approveBlast: (blastId: string) => void;
  rejectBlast: (blastId: string, reason: string) => void;
  getRecipientsForBlast: (blastId: string) => DbEmailBlastRecipient[];
}

const PendingApprovalsPanel: React.FC<PendingApprovalsPanelProps> = ({
  pendingBlasts,
  isManager,
  approveBlast,
  rejectBlast,
  getRecipientsForBlast,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { addToast } = useToast();

  // Toggle individual selection
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Select all / none
  const selectAll = () => {
    if (selectedIds.size === pendingBlasts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingBlasts.map((b) => b.id)));
    }
  };

  // Batch approve
  const handleBatchApprove = () => {
    selectedIds.forEach((id) => approveBlast(id));
    setSelectedIds(new Set());
  };

  // Get composer user
  const getComposer = (composedBy: string): User | undefined =>
    USERS.find((u) => u.id === composedBy);

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const days = Math.floor(diffHours / 24);
    return `${days}d ago`;
  };

  // Determine priority (>48h urgent)
  const isUrgent = (createdAt: string): boolean => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours > 48;
  };

  if (!isManager) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-5">
        <AlertTriangle className="text-amber-500" size={18} />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Pending Approval</h3>
        {pendingBlasts.length > 0 && (
          <span className="ml-auto bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold px-2 py-0.5 rounded-full">
            {pendingBlasts.length}
          </span>
        )}
      </div>

      {/* Batch actions */}
      {pendingBlasts.length > 1 && (
        <div className="mb-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll} className="text-xs h-8">
            {selectedIds.size === pendingBlasts.length ? 'Deselect All' : 'Select All'}
          </Button>
          {selectedIds.size > 0 && (
            <Button size="sm" className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500" onClick={handleBatchApprove}>
              Approve Selected ({selectedIds.size})
            </Button>
          )}
        </div>
      )}

      {pendingBlasts.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={<CheckCircle className="text-emerald-500" size={32} />}
            title="All caught up!"
            description="No blasts pending your approval."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {pendingBlasts.map((blast) => {
            const composer = getComposer(blast.composedBy);
            const urgent = isUrgent(blast.createdAt);
            const recipients = getRecipientsForBlast(blast.id);
            const bodyPreview = blast.body.length > 80 ? blast.body.slice(0, 80) + '...' : blast.body;
            const isSelected = selectedIds.has(blast.id);

            return (
              <div
                key={blast.id}
                className={`border rounded-lg p-4 transition-all hover:shadow-sm ${
                  urgent
                    ? 'border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-900/10'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                {/* Header with composer info and priority */}
                <div className="flex items-start justify-between gap-2.5 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {urgent && (
                      <Badge variant="destructive" className="text-[10px] uppercase shrink-0">
                        Urgent
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 min-w-0">
                      {selectedIds.size > 0 && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(blast.id)}
                          className="mt-0.5"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {blast.subject}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            {composer?.avatar ? (
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={composer.avatar} alt={composer.name} />
                                <AvatarFallback className="text-[8px]">{composer.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <UserIcon size={12} />
                            )}
                            {composer?.name || 'Unknown'}
                          </span>
                          <span>•</span>
                          <span>{formatRelativeTime(blast.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 font-medium">{recipients.length} recipients</span>
                </div>

                {/* Body preview */}
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3.5 leading-relaxed line-clamp-2">
                  {bodyPreview}
                </p>

                {/* Actions */}
                <div className="flex gap-2.5">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9"
                    onClick={() => approveBlast(blast.id)}
                  >
                    <CheckCircle size={12} className="mr-1.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-9 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
                    onClick={() => setRejectingId(blast.id)}
                  >
                    <XCircle size={12} className="mr-1.5" />
                    Reject
                  </Button>
                </div>

                {/* Rejection dialog */}
                <AlertDialog open={rejectingId === blast.id} onOpenChange={(open) => !open && setRejectingId(null)}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Email Blast</AlertDialogTitle>
                      <AlertDialogDescription>
                        Please provide a reason for rejection. This will be communicated to the composer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={4}
                      placeholder="Enter rejection reason..."
                      autoFocus
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => { setRejectingId(null); setRejectionReason(''); }}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (rejectionReason.trim()) {
                            rejectBlast(blast.id, rejectionReason.trim());
                            addToast({
                              type: 'success',
                              title: 'Blast Rejected',
                              message: 'The email blast has been rejected.',
                            });
                            setRejectingId(null);
                            setRejectionReason('');
                          }
                        }}
                        className="bg-red-500 hover:bg-red-600"
                        disabled={!rejectionReason.trim()}
                      >
                        Reject
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingApprovalsPanel;
