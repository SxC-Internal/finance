'use client'

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Bell, X } from 'lucide-react';
import type { User, Theme } from '@/types';
import { useEmailBlast } from '@/hooks/useEmailBlast';
import BlastComposerForm from '@/components/finance/email/BlastComposerForm';
import BlastHistoryTable from '@/components/finance/email/BlastHistoryTable';
import PendingApprovalsPanel from '@/components/finance/email/PendingApprovalsPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FinanceEmailBlastViewProps {
  user: User;
  theme: Theme;
}

const FinanceEmailBlastView: React.FC<FinanceEmailBlastViewProps> = ({ user, theme }) => {
  const {
    allBlasts,
    pendingBlasts,
    isLoading,
    isManager,
    financeRole,
    fallbackWarning,
    composerSubject,
    composerBody,
    composerSenderName,
    composerSenderEmail,
    composerReplyToEmail,
    authorizedFromEmails,
    composerRecipients,
    setComposerSubject,
    setComposerBody,
    setComposerSenderName,
    setComposerSenderEmail,
    setComposerReplyToEmail,
    addComposerRecipient,
    removeComposerRecipient,
    saveDraft,
    submitForApproval,
    approveBlast,
    rejectBlast,
    archiveBlast,
    duplicateBlast,
    resendBlast,
    getRecipientsForBlast,
  } = useEmailBlast(user);

  const [showPreview, setShowPreview] = useState(false);
  const [showApprovalsModal, setShowApprovalsModal] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showApprovalsModal) {
        setShowApprovalsModal(false);
      }
    };

    if (showApprovalsModal) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showApprovalsModal]);

  const roleBadgeLabel = financeRole === 'manager' ? 'Finance Manager' : 'Finance Associate';
  const roleBadgeCls =
    financeRole === 'manager'
      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-72 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm p-6 space-y-4">
          <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse" />
          <div className="h-32 w-full rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 w-full rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Fallback warning banner */}
      {fallbackWarning && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <span className="font-semibold">Warning:</span>
          <span>{fallbackWarning}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Email Blast</h2>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${roleBadgeCls}`}
            >
              {roleBadgeLabel}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Mail size={15} />
            Compose and manage sponsorship/partner email blasts.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-3">
          {isManager && pendingBlasts.length > 0 && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowApprovalsModal(true)}
            >
              <Bell size={16} />
              <span>Pending Approval</span>
              <span className="ml-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingBlasts.length}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Composer with optional preview */}
        <BlastComposerForm
          composerSubject={composerSubject}
          composerBody={composerBody}
          composerSenderName={composerSenderName}
          composerSenderEmail={composerSenderEmail}
          composerReplyToEmail={composerReplyToEmail}
          authorizedFromEmails={authorizedFromEmails}
          composerRecipients={composerRecipients}
          isManager={isManager}
          setComposerSubject={setComposerSubject}
          setComposerBody={setComposerBody}
          setComposerSenderName={setComposerSenderName}
          setComposerSenderEmail={setComposerSenderEmail}
          setComposerReplyToEmail={setComposerReplyToEmail}
          addComposerRecipient={addComposerRecipient}
          removeComposerRecipient={removeComposerRecipient}
          saveDraft={saveDraft}
          submitForApproval={submitForApproval}
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview(!showPreview)}
        />

        {/* History */}
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Blast History
          </h3>
          <BlastHistoryTable
            blasts={allBlasts}
            getRecipientsForBlast={getRecipientsForBlast}
            onResend={isManager ? resendBlast : undefined}
            onDuplicate={isManager ? duplicateBlast : undefined}
            onArchive={isManager ? archiveBlast : undefined}
          />
        </div>
      </div>

      {/* Pending Approvals Modal - Rendered via Portal with theme support */}
      {isManager && showApprovalsModal &&
        createPortal(
          <div
            className={cn(
              theme,
              'fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200'
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pending-approval-title"
            aria-describedby="pending-approval-description"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-colors duration-300"
              onClick={() => setShowApprovalsModal(false)}
              aria-hidden="true"
            />

            {/* Modal content */}
            <div className={cn(
              'relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col transition-all',
              showApprovalsModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            )}>
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Bell className="text-amber-500 dark:text-amber-400" size={20} />
                  <h3
                    id="pending-approval-title"
                    className="text-lg font-bold text-slate-900 dark:text-slate-100"
                  >
                    Pending Approval
                  </h3>
                  <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">
                    {pendingBlasts.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  onClick={() => setShowApprovalsModal(false)}
                  aria-label="Close pending approval modal"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Modal body - scrollable */}
              <div
                id="pending-approval-description"
                className="flex-1 overflow-y-auto p-6"
              >
                <PendingApprovalsPanel
                  pendingBlasts={pendingBlasts}
                  isManager={isManager}
                  approveBlast={approveBlast}
                  rejectBlast={rejectBlast}
                  getRecipientsForBlast={getRecipientsForBlast}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default FinanceEmailBlastView;
