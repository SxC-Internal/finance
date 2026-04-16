'use client';

import React, { useState, useMemo } from 'react';
import { Send, Save, X, Plus, Info, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import BlastComposerPreview from './BlastComposerPreview';
import RichTextEditor from './RichTextEditor';

interface BlastComposerFormProps {
  composerSubject: string;
  composerBody: string;
  composerSenderName: string;
  composerSenderEmail: string;
  composerReplyToEmail: string;
  authorizedFromEmails: string[];
  composerRecipients: string[];
  isManager: boolean;
  setComposerSubject: (s: string) => void;
  setComposerBody: (b: string) => void;
  setComposerSenderName: (name: string) => void;
  setComposerSenderEmail: (email: string) => void;
  setComposerReplyToEmail: (email: string) => void;
  addComposerRecipient: (email: string) => void;
  removeComposerRecipient: (email: string) => void;
  saveDraft: () => void;
  submitForApproval: () => void;
  showPreview?: boolean;
  onTogglePreview?: () => void;
}

const inputCls =
  'w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm';

const BlastComposerForm: React.FC<BlastComposerFormProps> = ({
  composerSubject,
  composerBody,
  composerSenderName,
  composerSenderEmail,
  composerReplyToEmail,
  authorizedFromEmails,
  composerRecipients,
  isManager,
  setComposerSubject,
  setComposerBody,
  setComposerSenderName,
  setComposerSenderEmail,
  setComposerReplyToEmail,
  addComposerRecipient,
  removeComposerRecipient,
  saveDraft,
  submitForApproval,
  showPreview = false,
  onTogglePreview,
}) => {
  const [recipientInput, setRecipientInput] = useState('');
  const [emailErrors, setEmailErrors] = useState<Record<string, boolean>>({});

  const MAX_SUBJECT_LENGTH = 50;
  const WARN_SUBJECT_LENGTH = 45;

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Character count color
  const subjectLength = composerSubject.length;
  const subjectCountColor = useMemo(() => {
    if (subjectLength > MAX_SUBJECT_LENGTH) return 'text-red-500';
    if (subjectLength >= WARN_SUBJECT_LENGTH) return 'text-amber-500';
    return 'text-emerald-600 dark:text-emerald-400';
  }, [subjectLength]);

  // Validate recipients on blur
  const handleRecipientBlur = (email: string) => {
    if (email && !isValidEmail(email)) {
      setEmailErrors((prev) => ({ ...prev, [email]: true }));
    } else {
      setEmailErrors((prev) => ({ ...prev, [email]: false }));
    }
  };

  const handleAddRecipient = () => {
    if (!recipientInput.trim()) return;
    const email = recipientInput.trim();
    if (!isValidEmail(email)) {
      setEmailErrors((prev) => ({ ...prev, [email]: true }));
      return;
    }
    addComposerRecipient(email);
    setRecipientInput('');
    setEmailErrors((prev) => ({ ...prev, [email]: false }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRecipient();
    }
  };

  // Validation status
  const invalidRecipientsCount = Object.values(emailErrors).filter((err) => err).length;
  const canSubmit =
    composerSubject.trim().length > 0 &&
    composerBody.trim().length > 0 &&
    composerSenderEmail.trim().length > 0 &&
    composerRecipients.length > 0 &&
    invalidRecipientsCount === 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none">
      {/* Form Content */}
      <div className="p-6">
        <div className="mb-5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Send In 3 Steps</p>
          <ol className="mt-1 list-decimal pl-5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <li>Fill subject and message.</li>
            <li>Add sender email and at least one recipient, then click Add.</li>
            <li>Click {isManager ? 'Send Blast' : 'Submit for Approval'}.</li>
          </ol>
        </div>

        {/* Two-column layout when preview is shown */}
        <div className={cn('grid gap-6', showPreview ? 'lg:grid-cols-5' : '')}>
          {/* Left / Top - Form */}
          <div className={cn('space-y-6', showPreview && 'lg:col-span-3')}>
            {/* Header with toggle */}
            {onTogglePreview && (
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Compose Email Blast</h3>
                <button
                  type="button"
                  onClick={onTogglePreview}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                    showPreview
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  )}
                >
                  {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                </button>
              </div>
            )}

            {/* Subject with character counter */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Subject <span className="text-red-500">*</span>
                </label>
                <span className={cn('text-xs font-bold', subjectCountColor)}>
                  {subjectLength}/{MAX_SUBJECT_LENGTH}
                </span>
              </div>
              <input
                type="text"
                value={composerSubject}
                onChange={(e) => setComposerSubject(e.target.value.slice(0, MAX_SUBJECT_LENGTH + 5))}
                className={cn(
                  inputCls,
                  subjectLength > MAX_SUBJECT_LENGTH && 'border-red-500 focus:ring-red-500',
                  subjectLength >= WARN_SUBJECT_LENGTH && subjectLength <= MAX_SUBJECT_LENGTH && 'border-amber-500 focus:ring-amber-500'
                )}
                placeholder="e.g., SxC – Sponsorship Opportunity"
              />
              {subjectLength > MAX_SUBJECT_LENGTH && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  Subject exceeds recommended 50 character limit
                </p>
              )}
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                Message <span className="text-red-500">*</span>
              </label>
              <RichTextEditor
                value={composerBody}
                onChange={setComposerBody}
                minRows={showPreview ? 10 : 8}
              />
            </div>

            {/* Sender identity */}
            <div className="space-y-3">
              {/* FROM address dropdown */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                  From <span className="text-red-500">*</span>
                </label>
                {authorizedFromEmails.length > 1 ? (
                  <select
                    value={composerSenderEmail}
                    onChange={(e) => setComposerSenderEmail(e.target.value)}
                    className={inputCls}
                  >
                    {authorizedFromEmails.map((email) => (
                      <option key={email} value={email}>{email}</option>
                    ))}
                  </select>
                ) : (
                  <div className={cn(inputCls, 'text-slate-500 dark:text-slate-400 cursor-default select-none')}>
                    {composerSenderEmail || authorizedFromEmails[0] || 'Loading…'}
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  The address recipients see as the sender. Only authorized addresses are shown.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Display name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={composerSenderName}
                    onChange={(e) => setComposerSenderName(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. SxC Finance"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Display name shown alongside the From address.
                  </p>
                </div>

                {/* Reply-To */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                    Reply-To Email
                  </label>
                  <input
                    type="email"
                    value={composerReplyToEmail}
                    onChange={(e) => setComposerReplyToEmail(e.target.value)}
                    className={cn(
                      inputCls,
                      composerReplyToEmail.trim().length > 0 &&
                      !isValidEmail(composerReplyToEmail.trim()) &&
                      'border-red-500 focus:ring-red-500'
                    )}
                    placeholder="your-email@gmail.com"
                  />
                  {composerReplyToEmail.trim().length > 0 &&
                    !isValidEmail(composerReplyToEmail.trim()) && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
                        <AlertCircle size={12} />
                        Reply-to email format is invalid
                      </p>
                    )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Where replies go when recipients click Reply.
                  </p>
                </div>
              </div>
            </div>

            {/* Recipients with validation */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                Recipients <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => handleRecipientBlur(recipientInput)}
                    className={cn(
                      inputCls,
                      emailErrors[recipientInput] && 'border-red-500 focus:ring-red-500'
                    )}
                    placeholder="email@example.com"
                  />
                  {emailErrors[recipientInput] && (
                    <p className="absolute -bottom-5 left-0 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={10} />
                      Invalid email format
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddRecipient}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-sm transition-all shrink-0"
                >
                  <Plus size={15} />
                  <span>Add</span>
                </button>
              </div>

              {/* Recipient chips with validation status */}
              {composerRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {composerRecipients.map((email) => (
                    <span
                      key={email}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                        emailErrors[email]
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      )}
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => removeComposerRecipient(email)}
                        className={cn(
                          'hover:text-red-600 dark:hover:text-red-400 transition-colors',
                          emailErrors[email] && 'text-red-700 dark:text-red-300'
                        )}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Validation summary */}
              {invalidRecipientsCount > 0 && (
                <div className="mt-2.5 flex items-center gap-2 text-xs text-red-500">
                  <AlertCircle size={12} />
                  <span>{invalidRecipientsCount} invalid recipient(s)</span>
                </div>
              )}
            </div>

            {/* Associate note */}
            {!isManager && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-300">
                <Info size={15} className="shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">
                  Blasts require manager approval before sending.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={saveDraft}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              >
                <Save size={15} />
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                onClick={submitForApproval}
                disabled={!canSubmit}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all shadow-[0_0_15px_rgba(5,150,105,0.25)]"
                title={isManager ? 'Send immediately as manager' : 'Submit to manager for approval'}
              >
                <Send size={15} />
                <span>{isManager ? 'Send Blast' : 'Submit for Approval'}</span>
              </button>
            </div>
          </div>

          {/* Right - Preview (when enabled) */}
          {showPreview && (
            <div className="lg:col-span-2">
              <div>
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <Eye size={14} />
                  Live Preview
                </h4>
                <BlastComposerPreview subject={composerSubject} body={composerBody} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlastComposerForm;
