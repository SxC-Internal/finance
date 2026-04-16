'use client';

import React, { useEffect, useState } from 'react';
import { X, Receipt } from 'lucide-react';
import type { DbFinanceProgramBudget, ExpenseCategory } from '@/types';
import type { AddExpenseData } from '@/hooks/useCapitalManagement';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddExpenseData & { category?: ExpenseCategory }) => void;
  programBudgets: DbFinanceProgramBudget[];
  defaultProgramBudgetId?: string;
}

const inputCls =
  'w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';
const labelCls = 'block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Marketing',
  'Operations',
  'Venue',
  'Catering',
  'Equipment',
  'Travel',
  'Other',
];

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  programBudgets,
  defaultProgramBudgetId,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [programBudgetId, setProgramBudgetId] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Other');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setProgramBudgetId(defaultProgramBudgetId ?? '');
      setCategory('Other');
    }
  }, [isOpen, defaultProgramBudgetId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!title.trim() || isNaN(parsed) || parsed <= 0) return;
    onSubmit({
      title: title.trim(),
      amount: parsed,
      transactionDate: date,
      programBudgetId: programBudgetId || undefined,
      category,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <Receipt className="text-red-500" size={22} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Expense</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              placeholder="e.g., Venue Rental"
              required
            />
          </div>

          <div>
            <label className={labelCls}>
              Amount (IDR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
              placeholder="0"
              min="1"
              step="1"
              required
            />
          </div>

          <div>
            <label className={labelCls}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Category</label>
            <Select value={category} onValueChange={(value) => setCategory(value as ExpenseCategory)}>
              <SelectTrigger className={inputCls}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className={labelCls}>Program Budget</label>
            <select
              value={programBudgetId}
              onChange={(e) => setProgramBudgetId(e.target.value)}
              className={inputCls}
            >
              <option value="">Unlinked</option>
              {programBudgets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg font-semibold transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)]"
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
