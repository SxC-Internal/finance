'use client';

import React, { useState, useMemo } from 'react';
import { Send, Save, X, Plus, Info, Eye, EyeOff, AlertCircle, Paperclip, ImagePlus, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import BlastComposerPreview from './BlastComposerPreview';
import RichTextEditor from './RichTextEditor';
import type { DbEmailBlastAttachment } from '@/types';

interface BlastComposerFormProps {
  composerSubject: string;
  composerBody: string;
  composerContentMode: 'text' | 'html';
  composerSenderName: string;
  composerSenderEmail: string;
  composerReplyToEmail: string;
  authorizedFromEmails: string[];
  composerRecipients: string[];
  composerAttachments: DbEmailBlastAttachment[];
  isUploadingAttachment: boolean;
  isManager: boolean;
  setComposerSubject: (s: string) => void;
  setComposerBody: (b: string) => void;
  setComposerContentMode: (m: 'text' | 'html') => void;
  setComposerSenderName: (name: string) => void;
  setComposerSenderEmail: (email: string) => void;
  setComposerReplyToEmail: (email: string) => void;
  addComposerRecipient: (email: string) => void;
  removeComposerRecipient: (email: string) => void;
  uploadComposerAttachment: (file: File) => void;
  removeComposerAttachment: (attachmentId: string) => void;
  insertImageIntoComposerBody: (attachmentId: string) => void;
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
  composerContentMode,
  composerSenderName,
  composerSenderEmail,
  composerReplyToEmail,
  authorizedFromEmails,
  composerRecipients,
  composerAttachments,
  isUploadingAttachment,
  isManager,
  setComposerSubject,
  setComposerBody,
  setComposerContentMode,
  setComposerSenderName,
  setComposerSenderEmail,
  setComposerReplyToEmail,
  addComposerRecipient,
  removeComposerRecipient,
  uploadComposerAttachment,
  removeComposerAttachment,
  insertImageIntoComposerBody,
  saveDraft,
  submitForApproval,
  showPreview = false,
  onTogglePreview,
}) => {
  const [recipientInput, setRecipientInput] = useState('');
  const [emailErrors, setEmailErrors] = useState<Record<string, boolean>>({});
  const [csvSummary, setCsvSummary] = useState<{ imported: number; duplicates: number; invalid: number } | null>(null);

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

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("CSV file is too large (max 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) return;

      const headerLine = lines[0].toLowerCase();
      const delimiter = headerLine.includes(',') ? ',' : headerLine.includes(';') ? ';' : '\t';
      const headers = headerLine.split(delimiter).map(h => h.trim());

      const emailColIdx = headers.findIndex(h => h.includes('email'));
      if (emailColIdx === -1) {
        alert("Could not find an 'email' column in the CSV.");
        return;
      }

      let importedCount = 0;
      let duplicateCount = 0;
      let invalidCount = 0;

      const currentEmails = new Set(composerRecipients.map(r => r.toLowerCase()));

      lines.slice(1).forEach(line => {
        if (!line.trim()) return;
        const columns = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
        if (columns.length <= emailColIdx) return;

        const rawEmail = columns[emailColIdx];
        if (!rawEmail) return;

        const email = rawEmail.toLowerCase();

        if (!isValidEmail(email)) {
          invalidCount++;
        } else if (currentEmails.has(email)) {
          duplicateCount++;
        } else {
          currentEmails.add(email);
          addComposerRecipient(email);
          importedCount++;
        }
      });

      setCsvSummary({ imported: importedCount, duplicates: duplicateCount, invalid: invalidCount });
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
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
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Message <span className="text-red-500">*</span>
                </label>
                <div className="flex bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={() => setComposerContentMode("text")}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-all",
                      composerContentMode === "text"
                        ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposerContentMode("html")}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-all",
                      composerContentMode === "html"
                        ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    HTML
                  </button>
                </div>
              </div>
              <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                {composerContentMode === 'html'
                  ? 'HTML mode: use the toolbar for bold, lists, links, and headings.'
                  : 'Text mode: plain text only. Any HTML tags are treated as literal text.'}
              </p>
              {composerContentMode === 'html' ? (
                <RichTextEditor
                  value={composerBody}
                  onChange={setComposerBody}
                  minRows={showPreview ? 10 : 8}
                />
              ) : (
                <textarea
                  value={composerBody}
                  onChange={(e) => setComposerBody(e.target.value)}
                  className={cn(inputCls, 'min-h-[180px] resize-y leading-relaxed font-mono')}
                  placeholder="Write plain-text content. Line breaks are preserved."
                  aria-label="Message"
                />
              )}
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
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Recipients <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <a href="/csv-template.csv" download className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                    Download Template
                  </a>
                  <label className="cursor-pointer text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md transition-colors border border-slate-200 dark:border-slate-600">
                    Import CSV
                    <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                  </label>
                </div>
              </div>
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

              {/* CSV Import Summary */}
              {csvSummary && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/30 text-xs text-emerald-800 dark:text-emerald-300 flex justify-between items-center">
                  <span>
                    <strong>{csvSummary.imported}</strong> imported, <strong>{csvSummary.duplicates}</strong> duplicates skipped, <strong>{csvSummary.invalid}</strong> invalid.
                  </span>
                  <button type="button" onClick={() => setCsvSummary(null)} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Associate note */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Attachments
                </label>
                <label className="cursor-pointer inline-flex items-center gap-2 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md transition-colors border border-slate-200 dark:border-slate-600">
                  {isUploadingAttachment ? <LoaderCircle size={12} className="animate-spin" /> : <Paperclip size={12} />}
                  <span>{isUploadingAttachment ? 'Uploading...' : 'Upload File'}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.docx,.xlsx,.pptx,.csv,.txt"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      uploadComposerAttachment(file);
                      event.target.value = '';
                    }}
                  />
                </label>
              </div>
              {composerAttachments.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload images or files to include with this blast. Supported: png, jpg, gif, webp, pdf, docx, xlsx, pptx, csv, txt.
                </p>
              ) : (
                <div className="space-y-2">
                  {composerAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{attachment.filename}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{Math.ceil(attachment.sizeBytes / 1024)} KB</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {composerContentMode === 'html' && attachment.kind === 'image' && attachment.publicUrl && (
                          <button
                            type="button"
                            onClick={() => insertImageIntoComposerBody(attachment.id)}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 text-[11px] font-medium"
                          >
                            <ImagePlus size={11} />
                            Insert
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeComposerAttachment(attachment.id)}
                          className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
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
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all shadow-sm"
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
                <BlastComposerPreview
                  subject={composerSubject}
                  body={composerBody}
                  contentMode={composerContentMode}
                  attachments={composerAttachments}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default BlastComposerForm;
