'use client'

import React, { useEffect, useRef, useState } from 'react';
import { X, TrendingUp } from 'lucide-react';
import type { AddIncomeData } from '@/hooks/useCapitalManagement';
import { logIncomeSchema } from '@/lib/schemas';

interface LogIncomeModalProps {
  isOpen: boolean;
  isManager: boolean;
  onClose: () => void;
  onSubmit: (data: AddIncomeData) => void;
}

const inputCls =
  'w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';
const inputErrCls =
  'w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-red-400 dark:border-red-500 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500';
const labelCls = 'block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2';

const LogIncomeModal: React.FC<LogIncomeModalProps> = ({ isOpen, isManager, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [errors, setErrors] = useState<{ title?: string; amount?: string; date?: string }>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const titleId = 'log-income-title';

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setErrors({});
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !isManager) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = logIncomeSchema.safeParse({ title, amount, date });
    if (!result.success) {
      const fieldErrors: { title?: string; amount?: string; date?: string } = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof typeof fieldErrors;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    onSubmit({ title: title.trim(), amount: parseFloat(amount), transactionDate: date });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <TrendingUp className="text-emerald-500" size={22} />
            <h2 id={titleId} className="text-xl font-bold text-slate-900 dark:text-white">Log Income</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="li-title" className={labelCls}>
              Description <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="li-title"
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
              className={errors.title ? inputErrCls : inputCls}
              placeholder="e.g., Sponsorship – Saff n Co."
              aria-describedby={errors.title ? 'li-title-err' : undefined}
              aria-invalid={!!errors.title}
            />
            {errors.title && <p id="li-title-err" className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="li-amount" className={labelCls}>
              Amount (IDR) <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="li-amount"
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: undefined })); }}
              className={errors.amount ? inputErrCls : inputCls}
              placeholder="0"
              min="1"
              step="1"
              aria-describedby={errors.amount ? 'li-amount-err' : undefined}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && <p id="li-amount-err" className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label htmlFor="li-date" className={labelCls}>Date</label>
            <input
              id="li-date"
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: undefined })); }}
              className={errors.date ? inputErrCls : inputCls}
              aria-describedby={errors.date ? 'li-date-err' : undefined}
              aria-invalid={!!errors.date}
            />
            {errors.date && <p id="li-date-err" className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Log Income
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogIncomeModal;
