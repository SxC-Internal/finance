'use client'

import React, { useEffect, useState } from 'react';
import { X, Wallet } from 'lucide-react';
import type { DbFinanceProgramBudget } from '@/types';
import { formatIDR } from '@/lib/finance';

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

  // Adjust existing state
  const [selectedBudgetId, setSelectedBudgetId] = useState('');
  const [newAllocation, setNewAllocation] = useState('');

  // New program state
  const [programName, setProgramName] = useState('');
  const [initialAllocation, setInitialAllocation] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTab('adjust');
      setSelectedBudgetId(programBudgets[0]?.id ?? '');
      setNewAllocation('');
      setProgramName('');
      setInitialAllocation('');
    }
  }, [isOpen, programBudgets]);

  if (!isOpen || !isManager) return null;

  const selectedBudget = programBudgets.find((b) => b.id === selectedBudgetId);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(newAllocation);
    if (!selectedBudgetId || isNaN(parsed) || parsed <= 0) return;
    onUpdateAllocation(selectedBudgetId, parsed);
    onClose();
  };

  const handleNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(initialAllocation);
    if (!programName.trim() || isNaN(parsed) || parsed <= 0) return;
    onAddProgram(programName.trim(), parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <Wallet className="text-emerald-500" size={22} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Allocate Budget</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {(['adjust', 'new'] as TabMode[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === t
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
                <label className={labelCls}>Program</label>
                <select
                  value={selectedBudgetId}
                  onChange={(e) => {
                    setSelectedBudgetId(e.target.value);
                    setNewAllocation('');
                  }}
                  className={inputCls}
                >
                  {programBudgets.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
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
                <label className={labelCls}>
                  New Allocation Amount (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newAllocation}
                  onChange={(e) => setNewAllocation(e.target.value)}
                  className={inputCls}
                  placeholder="0"
                  min="1"
                  step="1"
                  required
                />
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-all shadow-[0_0_15px_rgba(5,150,105,0.3)]"
                >
                  Update Allocation
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleNewSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>
                  Program Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  className={inputCls}
                  placeholder="e.g., SxLeadership"
                  required
                />
              </div>

              <div>
                <label className={labelCls}>
                  Initial Allocation (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={initialAllocation}
                  onChange={(e) => setInitialAllocation(e.target.value)}
                  className={inputCls}
                  placeholder="0"
                  min="1"
                  step="1"
                  required
                />
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-all shadow-[0_0_15px_rgba(5,150,105,0.3)]"
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
