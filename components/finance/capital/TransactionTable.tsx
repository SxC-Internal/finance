'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Search, ChevronUp, ChevronDown, Pencil, Trash2, X, Check } from 'lucide-react';
import type { DbFinanceTransaction, DbFinanceProgramBudget, ExpenseCategory } from '@/types';
import type { EditExpenseUpdates } from '@/hooks/useCapitalManagement';
import { formatIDR, CATEGORY_COLORS } from '@/lib/finance';

const PAGE_SIZE = 20;
const ALL_CATEGORIES: ExpenseCategory[] = [
  'Marketing', 'Operations', 'Venue', 'Catering', 'Equipment', 'Travel', 'Other',
];

type SortCol = 'date' | 'amount';
type SortDir = 'asc' | 'desc';
type TypeFilter = 'all' | 'income' | 'expense';

interface RowEditState {
  title: string;
  amount: string;
  category: string;
  transactionDate: string;
}

interface TransactionTableProps {
  transactions: DbFinanceTransaction[];
  programBudgets: DbFinanceProgramBudget[];
  isManager: boolean;
  onEditExpense: (id: string, updates: EditExpenseUpdates) => void;
  onDeleteExpense: (id: string) => void;
}

const selectCls =
  'text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white';

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  programBudgets,
  isManager,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [sortCol, setSortCol] = useState<SortCol>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<RowEditState>({
    title: '', amount: '', category: '', transactionDate: '',
  });
  const [editErrors, setEditErrors] = useState<Partial<RowEditState>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const programMap = useMemo(() => {
    const m = new Map<string, string>();
    programBudgets.forEach(b => m.set(b.id, b.name));
    return m;
  }, [programBudgets]);

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && (t.category || 'Other') !== categoryFilter) return false;
        if (programFilter !== 'all' && t.programBudgetId !== programFilter) return false;
        if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortCol === 'date') {
          return dir * (new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());
        }
        return dir * (a.amount - b.amount);
      });
  }, [transactions, typeFilter, categoryFilter, programFilter, search, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = useCallback((col: SortCol) => {
    setSortDir(prev => (sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'));
    setSortCol(col);
    setPage(0);
  }, [sortCol]);

  const startEdit = useCallback((tx: DbFinanceTransaction) => {
    setEditingId(tx.id);
    setEditState({
      title: tx.title,
      amount: String(tx.amount),
      category: tx.category || 'Other',
      transactionDate: tx.transactionDate,
    });
    setEditErrors({});
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditErrors({});
  }, []);

  const saveEdit = useCallback((tx: DbFinanceTransaction) => {
    const errors: Partial<RowEditState> = {};
    if (!editState.title.trim()) errors.title = 'Required';
    const amt = parseFloat(editState.amount);
    if (isNaN(amt) || amt <= 0) errors.amount = 'Must be > 0';
    if (!editState.transactionDate) errors.transactionDate = 'Required';
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    const updates: EditExpenseUpdates = {
      title: editState.title.trim(),
      amount: amt,
      transactionDate: editState.transactionDate,
    };
    if (tx.type === 'expense' && editState.category) {
      updates.category = editState.category as ExpenseCategory;
    }
    onEditExpense(tx.id, updates);
    setEditingId(null);
    setEditErrors({});
  }, [editState, onEditExpense]);

  const thCls = 'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Filter bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search transactions..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value as TypeFilter); setPage(0); }}
            className={selectCls}
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(0); }}
            className={selectCls}
          >
            <option value="all">All Categories</option>
            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={programFilter}
            onChange={e => { setProgramFilter(e.target.value); setPage(0); }}
            className={selectCls}
          >
            <option value="all">All Programs</option>
            {programBudgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>
      <p className="px-4 py-2 text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700/50">
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        {(typeFilter !== 'all' || categoryFilter !== 'all' || programFilter !== 'all' || search) ? ' (filtered)' : ''}
        {isManager && <span className="ml-2 text-slate-300 dark:text-slate-600">· Click a row to edit inline</span>}
      </p>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <th
                className={`${thCls} text-left cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors`}
                onClick={() => handleSort('date')}
              >
                <span className="flex items-center gap-1.5">
                  Date
                  {sortCol === 'date'
                    ? (sortDir === 'asc' ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />)
                    : <ChevronDown size={12} className="opacity-30" />}
                </span>
              </th>
              <th className={`${thCls} text-left`}>Description</th>
              <th className={`${thCls} text-left hidden md:table-cell`}>Program</th>
              <th className={`${thCls} text-left hidden sm:table-cell`}>Category</th>
              <th
                className={`${thCls} text-right cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors`}
                onClick={() => handleSort('amount')}
              >
                <span className="flex items-center justify-end gap-1.5">
                  Amount
                  {sortCol === 'amount'
                    ? (sortDir === 'asc' ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />)
                    : <ChevronDown size={12} className="opacity-30" />}
                </span>
              </th>
              {isManager && <th className={`${thCls} text-center w-20`}>Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={isManager ? 6 : 5}
                  className="px-4 py-12 text-center text-sm text-slate-400"
                >
                  No transactions match your filters.
                </td>
              </tr>
            ) : paginated.map(tx => (
              editingId === tx.id ? (
                <tr key={tx.id} className="bg-blue-50/60 dark:bg-blue-900/10">
                  <td className="px-4 py-2.5">
                    <div>
                      <input
                        type="date"
                        value={editState.transactionDate}
                        onChange={e => setEditState(s => ({ ...s, transactionDate: e.target.value }))}
                        className="w-full text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                      />
                      {editErrors.transactionDate && (
                        <p className="text-[10px] text-red-500 mt-0.5">{editErrors.transactionDate}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div>
                      <input
                        type="text"
                        value={editState.title}
                        onChange={e => setEditState(s => ({ ...s, title: e.target.value }))}
                        className="w-full text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                        autoFocus
                      />
                      {editErrors.title && (
                        <p className="text-[10px] text-red-500 mt-0.5">{editErrors.title}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400 hidden md:table-cell">
                    {tx.programBudgetId ? (programMap.get(tx.programBudgetId) || '—') : '—'}
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    {tx.type === 'expense' ? (
                      <select
                        value={editState.category}
                        onChange={e => setEditState(s => ({ ...s, category: e.target.value }))}
                        className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                      >
                        {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div>
                      <input
                        type="number"
                        value={editState.amount}
                        onChange={e => setEditState(s => ({ ...s, amount: e.target.value }))}
                        className="w-full text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white text-right"
                        min="1"
                      />
                      {editErrors.amount && (
                        <p className="text-[10px] text-red-500 mt-0.5 text-right">{editErrors.amount}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => saveEdit(tx)}
                        className="p-1.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors"
                        title="Save"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        title="Cancel"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr
                  key={tx.id}
                  className={`group transition-colors ${isManager ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30' : ''}`}
                  onClick={() => isManager && startEdit(tx)}
                >
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {tx.transactionDate}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${tx.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">
                        {tx.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell">
                    {tx.programBudgetId ? (programMap.get(tx.programBudgetId) || '—') : '—'}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {tx.category ? (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[tx.category]}20`,
                          color: CATEGORY_COLORS[tx.category],
                        }}
                      >
                        {tx.category}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold text-sm whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatIDR(tx.amount)}
                  </td>
                  {isManager && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(tx)}
                          className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(tx.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmDeleteId(null)}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Transaction</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteExpense(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
