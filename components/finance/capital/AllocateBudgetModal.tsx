'use client'

import React, { useEffect, useRef, useState } from 'react';
import { X, Wallet } from 'lucide-react';
import type { DbFinanceProgramBudget } from '@/types';
import { formatIDR } from '@/lib/finance';
import { adjustBudgetSchema, newProgramSchema } from '@/lib/schemas';

interface AllocateBudgetModalProps {
  isOpen: boolean;
  isManager: boolean;
  programBudgets: DbFinanceProgramBudget[];
  onClose: () => void;
  onUpdateAllocation: (programBudgetId: string, newAmount: number) => void;
  onAddProgram: (name: string, allocatedAmount: number) => void;
}

type TabMode = 'adjust' | 'new';

const inputCls =
  'w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';
const inputErrCls =
  'w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-red-400 dark:border-red-500 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500';
const labelCls = 'block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2';

const AllocateBudgetModal: React.FC<AllocateBudgetModalProps> = ({
  isOpen,
  isManager,
  programBudgets,
  onClose,
  onUpdateAllocation,
  onAddProgram,
}) => {
  const [tab, setTab] = useState<TabMode>('adjust');
  const [selectedBudgetId, setSelectedBudgetId] = useState('');
  const [newAllocation, setNewAllocation] = useState('');
  const [adjustErrors, setAdjustErrors] = useState<{ newAllocation?: string }>({});
  const [programName, setProgramName] = useState('');
  const [initialAllocation, setInitialAllocation] = useState('');
  const [newErrors, setNewErrors] = useState<{ programName?: string; initialAllocation?: string }>({});
  const firstInputRef = useRef<HTMLInputElement>(null);
  const titleId = 'allocate-budget-title';

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setTab('adjust');
      setSelectedBudgetId(programBudgets[0]?.id ?? '');
      setNewAllocation('');
      setProgramName('');
      setInitialAllocation('');
      setAdjustErrors({});
      setNewErrors({});
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [isOpen, programBudgets]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedBudget = programBudgets.find((b) => b.id === selectedBudgetId);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = adjustBudgetSchema.safeParse({ newAllocation });
    if (!result.success) {
      setAdjustErrors({ newAllocation: result.error.issues[0]?.message });
      return;
    }
    onUpdateAllocation(selectedBudgetId, parseFloat(newAllocation));
    onClose();
  };

  const handleNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = newProgramSchema.safeParse({ programName, initialAllocation });
    if (!result.success) {
      const fieldErrors: { programName?: string; initialAllocation?: string } = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof typeof fieldErrors;
        fieldErrors[field] = issue.message;
      });
      setNewErrors(fieldErrors);
      return;
    }
    onAddProgram(programName.trim(), parseFloat(initialAllocation));
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
            <Wallet className="text-emerald-500" size={22} />
            <h2 id={titleId} className="text-xl font-bold text-slate-900 dark:text-white">Allocate Budget</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-700" role="tablist">
          {(['adjust', 'new'] as TabMode[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 ${
                tab === t
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t === 'adjust' ? 'Adjust Existing' : 'New Program'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'adjust' ? (
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label htmlFor="ab-program" className={labelCls}>Program</label>
                <select
                  id="ab-program"
                  value={selectedBudgetId}
                  onChange={(e) => { setSelectedBudgetId(e.target.value); setNewAllocation(''); }}
                  className={inputCls}
                >
                  {programBudgets.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {selectedBudget && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Current allocation:{' '}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatIDR(selectedBudget.allocatedAmount)}
                  </span>
                </p>
              )}

              <div>
                <label htmlFor="ab-amount" className={labelCls}>
                  New Allocation Amount (IDR) <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="ab-amount"
                  ref={firstInputRef}
                  type="number"
                  value={newAllocation}
                  onChange={(e) => { setNewAllocation(e.target.value); setAdjustErrors({}); }}
                  className={adjustErrors.newAllocation ? inputErrCls : inputCls}
                  placeholder="0"
                  min="1"
                  step="1"
                  aria-describedby={adjustErrors.newAllocation ? 'ab-amount-err' : undefined}
                  aria-invalid={!!adjustErrors.newAllocation}
                />
                {adjustErrors.newAllocation && (
                  <p id="ab-amount-err" className="text-xs text-red-500 mt-1">{adjustErrors.newAllocation}</p>
                )}
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
                  Update Allocation
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleNewSubmit} className="space-y-4">
              <div>
                <label htmlFor="np-name" className={labelCls}>
                  Program Name <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="np-name"
                  type="text"
                  value={programName}
                  onChange={(e) => { setProgramName(e.target.value); setNewErrors((p) => ({ ...p, programName: undefined })); }}
                  className={newErrors.programName ? inputErrCls : inputCls}
                  placeholder="e.g., SxLeadership"
                  aria-describedby={newErrors.programName ? 'np-name-err' : undefined}
                  aria-invalid={!!newErrors.programName}
                />
                {newErrors.programName && (
                  <p id="np-name-err" className="text-xs text-red-500 mt-1">{newErrors.programName}</p>
                )}
              </div>

              <div>
                <label htmlFor="np-allocation" className={labelCls}>
                  Initial Allocation (IDR) <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="np-allocation"
                  type="number"
                  value={initialAllocation}
                  onChange={(e) => { setInitialAllocation(e.target.value); setNewErrors((p) => ({ ...p, initialAllocation: undefined })); }}
                  className={newErrors.initialAllocation ? inputErrCls : inputCls}
                  placeholder="0"
                  min="1"
                  step="1"
                  aria-describedby={newErrors.initialAllocation ? 'np-allocation-err' : undefined}
                  aria-invalid={!!newErrors.initialAllocation}
                />
                {newErrors.initialAllocation && (
                  <p id="np-allocation-err" className="text-xs text-red-500 mt-1">{newErrors.initialAllocation}</p>
                )}
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
                  Add Program
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllocateBudgetModal;
