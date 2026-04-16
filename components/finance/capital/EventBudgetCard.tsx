'use client';

import React, { useState, useMemo } from 'react';
import { Pencil, Trash2, PlusCircle, ChevronDown, ChevronUp, Calendar, Edit3, AlertTriangle, Receipt } from 'lucide-react';
import type { ProgramBudgetViewModel } from '@/types';
import type { DbFinanceTransaction, ExpenseCategory } from '@/types';
import { formatIDR } from '@/lib/finance';
import { getDaysRemaining, CATEGORY_COLORS } from '@/lib/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import EmptyState from '../shared/EmptyState';

interface EventBudgetCardProps {
  budget: ProgramBudgetViewModel;
  isManager: boolean;
  onAddExpense: (programBudgetId: string) => void;
  onEditExpense: (expense: DbFinanceTransaction) => void;
  onDeleteExpense: (expenseId: string) => void;
  onUpdateAllocation: (programBudgetId: string, newAmount: number) => void;
}

type ExpenseGroup = 'today' | 'thisWeek' | 'older';

const GROUP_LABELS: Record<ExpenseGroup, string> = {
  today: 'Today',
  thisWeek: 'This Week',
  older: 'Older',
};

const EventBudgetCard: React.FC<EventBudgetCardProps> = ({
  budget,
  isManager,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onUpdateAllocation,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingAllocation, setIsEditingAllocation] = useState(false);
  const [newAllocation, setNewAllocation] = useState(budget.allocatedAmount.toString());
  const [deleteConfirmExpenseId, setDeleteConfirmExpenseId] = useState<string | null>(null);

  const utilizationPercentage = budget.utilizationPercentage !== undefined
    ? budget.utilizationPercentage
    : budget.allocatedAmount > 0
    ? Math.min((budget.spent / budget.allocatedAmount) * 100, 100)
    : 0;

  const overBudget = budget.isOverBudget;

  // Gradient colors based on utilization
  const getProgressGradient = () => {
    if (utilizationPercentage <= 70) {
      return 'from-emerald-400 to-emerald-600';
    } else if (utilizationPercentage <= 90) {
      return 'from-amber-400 to-amber-600';
    } else {
      return 'from-red-400 to-red-600';
    }
  };

  // Days remaining
  const daysRemaining = useMemo(() => getDaysRemaining(budget.endDate), [budget.endDate]);

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups: Record<ExpenseGroup, DbFinanceTransaction[]> = {
      today: [],
      thisWeek: [],
      older: [],
    };

    budget.expenses.forEach((exp) => {
      const expDate = new Date(exp.transactionDate);
      expDate.setHours(0, 0, 0, 0);
      if (expDate.getTime() === today.getTime()) {
        groups.today.push(exp);
      } else if (expDate >= weekAgo) {
        groups.thisWeek.push(exp);
      } else {
        groups.older.push(exp);
      }
    });

    // Sort each group by date descending
    Object.keys(groups).forEach((group) => {
      groups[group as ExpenseGroup].sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
    });

    return groups;
  }, [budget.expenses]);

  // Handle allocation edit
  const handleAllocationSave = () => {
    const parsed = parseFloat(newAllocation);
    if (parsed > 0 && parsed !== budget.allocatedAmount) {
      onUpdateAllocation(budget.id, parsed);
    }
    setIsEditingAllocation(false);
  };

  const totalExpensesCount = budget.expenses.length;

  // Category badge component
  const CategoryBadge = ({ category }: { category?: ExpenseCategory }) => {
    if (!category) return null;
    const color = CATEGORY_COLORS[category] || '#6b7280';
    return (
      <span
        className="text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {category}
      </span>
    );
  };

  return (
    <div
      className={`flex flex-col rounded-xl border shadow-sm dark:shadow-none overflow-hidden transition-all ${overBudget
          ? 'border-red-400 dark:border-red-500/60 bg-red-50/40 dark:bg-red-900/10'
          : 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800'
        }`}
    >
      {/* Card header */}
      <div
        className="p-5 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate">
              {budget.name}
            </h3>
            {budget.endDate && (
              <div className="flex items-center gap-1 mt-1">
                <Calendar size={12} className="text-slate-400" />
                <span className={`text-[10px] font-medium ${daysRemaining !== null && daysRemaining < 7 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                  {daysRemaining !== null
                    ? daysRemaining < 0
                      ? `Ended ${Math.abs(daysRemaining)}d ago`
                      : `${daysRemaining} days left`
                    : 'No end date'}
                </span>
              </div>
            )}
          </div>
          {overBudget && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 shrink-0 ml-2">
              Over Budget
            </span>
          )}
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center relative">
          {[
            {
              label: 'Allocated',
              value: formatIDR(budget.allocatedAmount),
              color: 'text-blue-600 dark:text-blue-400',
              field: 'allocatedAmount',
            },
            { label: 'Spent', value: formatIDR(budget.spent), color: 'text-red-500', field: null },
            {
              label: 'Remaining',
              value: formatIDR(budget.remaining),
              color: budget.remaining < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400',
              field: null,
            },
          ].map(({ label, value, color, field }) => (
            <div key={label} className="relative group/allocation">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{label}</p>
              <p className={`text-xs font-bold mt-0.5 ${color}`}>{value}</p>

              {/* Inline edit for allocated amount (manager only, hover) */}
              {isManager && field === 'allocatedAmount' && !isEditingAllocation && (
                <button
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/allocation:opacity-100 bg-slate-50/80 dark:bg-slate-900/60 transition-opacity rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewAllocation(budget.allocatedAmount.toString());
                    setIsEditingAllocation(true);
                  }}
                  title="Edit allocation"
                >
                  <Edit3 size={14} className="text-blue-500" />
                </button>
              )}

              {/* Inline edit input */}
              {isEditingAllocation && field === 'allocatedAmount' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-1 z-10" onClick={(e) => e.stopPropagation()}>
                  <Input
                    type="number"
                    value={newAllocation}
                    onChange={(e) => setNewAllocation(e.target.value)}
                    className="h-6 text-xs w-full"
                    autoFocus
                    min="1"
                  />
                  <div className="flex gap-1 mt-1">
                    <Button size="sm" className="h-5 text-[10px] px-2" onClick={handleAllocationSave}>Save</Button>
                    <Button size="sm" variant="ghost" className="h-5 text-[10px] px-2" onClick={() => setIsEditingAllocation(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${getProgressGradient()}`}
            style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-[10px] text-slate-400">
            {budget.allocatedAmount > 0
              ? `${utilizationPercentage.toFixed(1)}% used`
              : 'No allocation'}
          </p>
          <button
            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{totalExpensesCount} expenses</span>
          </button>
        </div>
      </div>

      {/* Expense list - expandable */}
      {(isExpanded || totalExpensesCount <= 4) && (
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 bg-slate-50 dark:bg-slate-900/30">
          {totalExpensesCount === 0 ? (
            <EmptyState
              icon={<Receipt className="text-slate-400" size={24} />}
              title="No expenses yet"
              description="Start tracking spending by adding your first expense."
              actionLabel="Add Expense"
              onAction={() => onAddExpense(budget.id)}
              variant="compact"
            />
          ) : (
            // Show grouping if expanded
            isExpanded ? (
              Object.entries(groupedExpenses).map(([group, expenses]) =>
                expenses.length > 0 ? (
                  <div key={group}>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      {GROUP_LABELS[group as ExpenseGroup]}
                    </h4>
                    <div className="space-y-2">
                      {expenses.map((exp) => (
                        <div
                          key={exp.id}
                          className="flex items-start justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate">
                                {exp.title}
                              </p>
                              <CategoryBadge category={exp.category} />
                            </div>
                            <p className="text-xs text-slate-400">{exp.transactionDate}</p>
                          </div>
                          <div className="flex items-center space-x-2 ml-2 shrink-0">
                            <span className="text-sm font-semibold text-red-500">
                              -{formatIDR(exp.amount)}
                            </span>
                            {isManager && (
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => onEditExpense(exp)}
                                  className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                                  title="Edit"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmExpenseId(exp.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              )
            ) : (
              // Compact view: just first few expenses
              <div className="space-y-2">
                {budget.expenses.slice(0, 3).map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between group py-1"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate">
                          {exp.title}
                        </p>
                        <CategoryBadge category={exp.category} />
                      </div>
                      <p className="text-xs text-slate-400">{exp.transactionDate}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2 shrink-0">
                      <span className="text-sm font-semibold text-red-500">
                        -{formatIDR(exp.amount)}
                      </span>
                      {isManager && (
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditExpense(exp)}
                            className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmExpenseId(exp.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {budget.expenses.length > 3 && (
                  <p className="text-xs text-center text-slate-400 pt-1">
                    +{budget.expenses.length - 3} more (expand to see all)
                  </p>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700/50">
        <button
          onClick={() => onAddExpense(budget.id)}
          className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
        >
          <PlusCircle size={16} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmExpenseId} onOpenChange={(open) => !open && setDeleteConfirmExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmExpenseId) {
                  onDeleteExpense(deleteConfirmExpenseId);
                  setDeleteConfirmExpenseId(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventBudgetCard;
