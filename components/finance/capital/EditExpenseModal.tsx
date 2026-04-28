'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Pencil } from 'lucide-react';
import type { DbFinanceTransaction, DbFinanceProgramBudget, ExpenseCategory } from '@/types';
import type { EditExpenseUpdates } from '@/hooks/useCapitalManagement';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { editExpenseSchema } from '@/lib/schemas';

interface EditExpenseModalProps {
  isOpen: boolean;
  isManager: boolean;
  expense: DbFinanceTransaction | null;
  onClose: () => void;
  onSubmit: (id: string, updates: EditExpenseUpdates) => void;
  programBudgets: DbFinanceProgramBudget[];
}

const inputCls =
  'w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';
const inputErrCls =
  'w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-red-400 dark:border-red-500 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500';
const labelCls = 'block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Marketing', 'Operations', 'Venue', 'Catering', 'Equipment', 'Travel', 'Other',
];

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  isManager,
  expense,
  onClose,
  onSubmit,
  programBudgets,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [programBudgetId, setProgramBudgetId] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Other');
  const [errors, setErrors] = useState<{ title?: string; amount?: string; date?: string }>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const titleId = 'edit-expense-title';

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen && expense) {
      setTitle(expense.title);
      setAmount(String(expense.amount));
      setDate(expense.transactionDate);
      setProgramBudgetId(expense.programBudgetId ?? '');
      setCategory(expense.category || 'Other');
      setErrors({});
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen, expense]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !isManager || !expense) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = editExpenseSchema.safeParse({ title, amount, date, programBudgetId: programBudgetId || undefined, category });
    if (!result.success) {
      const fieldErrors: { title?: string; amount?: string; date?: string } = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof typeof fieldErrors;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    onSubmit(expense.id, {
      title: title.trim(),
      amount: parseFloat(amount),
      transactionDate: date,
      programBudgetId: programBudgetId || undefined,
      category,
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
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <Pencil className="text-amber-500" size={22} />
            <h2 id={titleId} className="text-xl font-bold text-slate-900 dark:text-white">Edit Expense</h2>
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
            <label htmlFor="ee-title" className={labelCls}>
              Title <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="ee-title"
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
              className={errors.title ? inputErrCls : inputCls}
              aria-describedby={errors.title ? 'ee-title-err' : undefined}
              aria-invalid={!!errors.title}
            />
            {errors.title && <p id="ee-title-err" className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="ee-amount" className={labelCls}>
              Amount (IDR) <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="ee-amount"
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: undefined })); }}
              className={errors.amount ? inputErrCls : inputCls}
              min="1"
              step="1"
              aria-describedby={errors.amount ? 'ee-amount-err' : undefined}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && <p id="ee-amount-err" className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label htmlFor="ee-date" className={labelCls}>Date</label>
            <input
              id="ee-date"
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: undefined })); }}
              className={errors.date ? inputErrCls : inputCls}
              aria-describedby={errors.date ? 'ee-date-err' : undefined}
              aria-invalid={!!errors.date}
            />
            {errors.date && <p id="ee-date-err" className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className={labelCls}>Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
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

          <div>
            <label htmlFor="ee-program" className={labelCls}>Program Budget</label>
            <select
              id="ee-program"
              value={programBudgetId}
              onChange={(e) => setProgramBudgetId(e.target.value)}
              className={inputCls}
            >
              <option value="">Unlinked</option>
              {programBudgets.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
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
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;
