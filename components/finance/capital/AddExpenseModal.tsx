'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Receipt } from 'lucide-react';
import type { ExpenseCategory } from '@/types';
import type { AddExpenseData } from '@/hooks/useCapitalManagement';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addExpenseSchema } from '@/lib/schemas';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddExpenseData & { category?: ExpenseCategory }) => void;
}

const inputCls =
  'w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';
const inputErrCls =
  'w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-red-400 dark:border-red-500 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500';
const labelCls = 'block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Marketing', 'Operations', 'Venue', 'Catering', 'Equipment', 'Travel', 'Other',
];

interface FormData {
  title: string;
  amount: string;
  date: string;
  category: ExpenseCategory;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<FormData>(() => ({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Other',
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const titleId = 'add-expense-title';

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Other',
      });
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = addExpenseSchema.safeParse({
      title: formData.title,
      amount: formData.amount,
      date: formData.date,
      category: formData.category,
    });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    onSubmit({
      title: formData.title.trim(),
      amount: parseFloat(formData.amount),
      transactionDate: formData.date,
      category: formData.category,
    });
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
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <Receipt className="text-red-500" size={22} />
            <h2 id={titleId} className="text-xl font-bold text-slate-900 dark:text-white">Add Expense</h2>
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
            <label htmlFor="ae-title" className={labelCls}>
              Title <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="ae-title"
              ref={titleRef}
              type="text"
              value={formData.title}
              onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setErrors({ ...errors, title: undefined }); }}
              className={errors.title ? inputErrCls : inputCls}
              placeholder="e.g., Venue Rental"
              aria-describedby={errors.title ? 'ae-title-err' : undefined}
              aria-invalid={!!errors.title}
            />
            {errors.title && <p id="ae-title-err" className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="ae-amount" className={labelCls}>
              Amount (IDR) <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="ae-amount"
              type="number"
              value={formData.amount}
              onChange={(e) => { setFormData({ ...formData, amount: e.target.value }); setErrors({ ...errors, amount: undefined }); }}
              className={errors.amount ? inputErrCls : inputCls}
              placeholder="0"
              min="1"
              step="1"
              aria-describedby={errors.amount ? 'ae-amount-err' : undefined}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && <p id="ae-amount-err" className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label htmlFor="ae-date" className={labelCls}>Date</label>
            <input
              id="ae-date"
              type="date"
              value={formData.date}
              onChange={(e) => { setFormData({ ...formData, date: e.target.value }); setErrors({ ...errors, date: undefined }); }}
              className={errors.date ? inputErrCls : inputCls}
              aria-describedby={errors.date ? 'ae-date-err' : undefined}
              aria-invalid={!!errors.date}
            />
            {errors.date && <p id="ae-date-err" className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className={labelCls}>Category</label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as ExpenseCategory })}
            >
              <SelectTrigger className={inputCls}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              className="px-5 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg font-semibold transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
