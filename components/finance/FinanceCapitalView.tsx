'use client'

import React, { useState } from 'react';
import { TrendingUp, Wallet, PlusCircle } from 'lucide-react';
import type { User, DbFinanceTransaction } from '@/types';
import { useCapitalManagement } from '@/hooks/useCapitalManagement';
import CapitalOverviewPanel from '@/components/finance/capital/CapitalOverviewPanel';
import EventBudgetCard from '@/components/finance/capital/EventBudgetCard';
import AddExpenseModal from '@/components/finance/capital/AddExpenseModal';
import EditExpenseModal from '@/components/finance/capital/EditExpenseModal';
import LogIncomeModal from '@/components/finance/capital/LogIncomeModal';
import AllocateBudgetModal from '@/components/finance/capital/AllocateBudgetModal';
import EmptyState from './shared/EmptyState';
import { Building2 } from 'lucide-react';

type ActiveModal = 'logIncome' | 'allocate' | 'addExpense' | 'editExpense' | null;

interface FinanceCapitalViewProps {
  user: User;
}

const FinanceCapitalView: React.FC<FinanceCapitalViewProps> = ({ user }) => {
  const {
    programBudgets,
    capitalOverview,
    programBudgetViewModels,
    isManager,
    financeRole,
    addExpense,
    editExpense,
    deleteExpense,
    logIncome,
    updateBudgetAllocation,
    addProgramBudget,
  } = useCapitalManagement(user);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [editingExpense, setEditingExpense] = useState<DbFinanceTransaction | null>(null);
  const [addExpenseDefaultBudgetId, setAddExpenseDefaultBudgetId] = useState<string | undefined>(
    undefined
  );

  const openAddExpense = (programBudgetId?: string) => {
    setAddExpenseDefaultBudgetId(programBudgetId);
    setActiveModal('addExpense');
  };

  const openEditExpense = (expense: DbFinanceTransaction) => {
    setEditingExpense(expense);
    setActiveModal('editExpense');
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingExpense(null);
    setAddExpenseDefaultBudgetId(undefined);
  };

  const roleBadgeLabel = financeRole === 'manager' ? 'Finance Manager' : 'Finance Associate';
  const roleBadgeCls =
    financeRole === 'manager'
      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Capital Management</h2>
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${roleBadgeCls}`}>
              {roleBadgeLabel}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Track income, expenses, and program budget allocations.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {isManager && (
            <>
              <button
                onClick={() => setActiveModal('logIncome')}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-sm transition-all shadow-[0_0_15px_rgba(5,150,105,0.25)]"
              >
                <TrendingUp size={16} />
                <span>Log Income</span>
              </button>
              <button
                onClick={() => setActiveModal('allocate')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.25)]"
              >
                <Wallet size={16} />
                <span>Allocate Budget</span>
              </button>
            </>
          )}
          <button
            onClick={() => openAddExpense()}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg font-semibold text-sm transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            <PlusCircle size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Overview panel */}
      <CapitalOverviewPanel capitalOverview={capitalOverview} />

      {/* Program budget grid */}
      {programBudgetViewModels.length === 0 ? (
        <EmptyState
          icon={<Building2 className="text-slate-400" size={24} />}
          title="No program budgets yet"
          description="Create your first program budget to start tracking allocations and spending."
          actionLabel="Allocate Budget"
          onAction={() => setActiveModal('allocate')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {programBudgetViewModels.map((budget) => (
            <EventBudgetCard
              key={budget.id}
              budget={budget}
              isManager={isManager}
              onAddExpense={openAddExpense}
              onEditExpense={openEditExpense}
              onDeleteExpense={deleteExpense}
              onUpdateAllocation={updateBudgetAllocation}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddExpenseModal
        isOpen={activeModal === 'addExpense'}
        onClose={closeModal}
        onSubmit={addExpense}
        programBudgets={programBudgets}
        defaultProgramBudgetId={addExpenseDefaultBudgetId}
      />
      <EditExpenseModal
        isOpen={activeModal === 'editExpense'}
        isManager={isManager}
        expense={editingExpense}
        onClose={closeModal}
        onSubmit={editExpense}
        programBudgets={programBudgets}
      />
      <LogIncomeModal
        isOpen={activeModal === 'logIncome'}
        isManager={isManager}
        onClose={closeModal}
        onSubmit={logIncome}
      />
      <AllocateBudgetModal
        isOpen={activeModal === 'allocate'}
        isManager={isManager}
        programBudgets={programBudgets}
        onClose={closeModal}
        onUpdateAllocation={updateBudgetAllocation}
        onAddProgram={addProgramBudget}
      />
    </div>
  );
};

export default FinanceCapitalView;
