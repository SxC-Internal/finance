'use client'

import React, { lazy, Suspense, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, PlusCircle, List, Building2 } from 'lucide-react';
import type { User, DbFinanceTransaction } from '@/types';
import { useCapitalManagement } from '@/hooks/useCapitalManagement';
import FinancePageHeader from '@/components/finance/shared/FinancePageHeader';
import FinancialStatCard from '@/components/finance/shared/FinancialStatCard';
import EventBudgetCard from '@/components/finance/capital/EventBudgetCard';
import TransactionTable from '@/components/finance/capital/TransactionTable';
import EmptyState from './shared/EmptyState';
import { ProgramCardSkeleton, StatCardSkeleton } from '@/components/ui/Skeleton';
import { formatIDR } from '@/lib/finance';

const AddExpenseModal = lazy(() => import('@/components/finance/capital/AddExpenseModal'));
const EditExpenseModal = lazy(() => import('@/components/finance/capital/EditExpenseModal'));
const LogIncomeModal = lazy(() => import('@/components/finance/capital/LogIncomeModal'));
const AllocateBudgetModal = lazy(() => import('@/components/finance/capital/AllocateBudgetModal'));

type ActiveModal = 'logIncome' | 'allocate' | 'addExpense' | 'editExpense' | null;

interface FinanceCapitalViewProps {
  user: User;
}

const FinanceCapitalView: React.FC<FinanceCapitalViewProps> = ({ user }) => {
  const {
    transactions,
    programBudgets,
    programBudgetViewModels,
    capitalOverview,
    isManager,
    financeRole,
    addExpense,
    editExpense,
    deleteExpense,
    logIncome,
    updateBudgetAllocation,
    addProgramBudget,
    isLoadingTransactions,
    isLoadingBudgets,
  } = useCapitalManagement(user);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [editingExpense, setEditingExpense] = useState<DbFinanceTransaction | null>(null);
  const [preselectedBudgetId, setPreselectedBudgetId] = useState<string>('');

  const openAddExpense = (budgetId?: string) => {
    setPreselectedBudgetId(budgetId ?? '');
    setActiveModal('addExpense');
  };

  const openEditExpense = (expense: DbFinanceTransaction) => {
    setEditingExpense(expense);
    setActiveModal('editExpense');
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingExpense(null);
    setPreselectedBudgetId('');
  };

  const roleBadgeLabel = financeRole === 'manager' ? 'Finance Manager' : 'Finance Associate';
  const isLoading = isLoadingTransactions || isLoadingBudgets;

  const totalAllocated = programBudgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
  const unallocatedExpenses = transactions
    .filter((t) => t.type === 'expense' && !t.programBudgetId)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <FinancePageHeader
        user={user}
        title="Capital Management"
        subtitle="Track income, expenses, and program budget allocations."
        isManager={isManager}
        roleBadgeLabel={roleBadgeLabel}
      />

      {/* Summary stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <FinancialStatCard
            label="Total Income"
            value={capitalOverview.totalIncome}
            formattedValue={formatIDR(capitalOverview.totalIncome)}
            icon={<TrendingUp className="text-emerald-500" size={20} />}
            isLoading={false}
          />
          <FinancialStatCard
            label="Allocated to Programs"
            value={totalAllocated}
            formattedValue={formatIDR(totalAllocated)}
            icon={<Wallet className="text-blue-500" size={20} />}
            isLoading={false}
          />
          <FinancialStatCard
            label="Total Expenses"
            value={capitalOverview.totalExpenses}
            formattedValue={formatIDR(capitalOverview.totalExpenses)}
            icon={<TrendingDown className="text-red-500" size={20} />}
            isLoading={false}
          />
          <FinancialStatCard
            label="Net Balance"
            value={capitalOverview.remaining}
            formattedValue={formatIDR(capitalOverview.remaining)}
            icon={capitalOverview.remaining >= 0
              ? <TrendingUp className="text-emerald-500" size={20} />
              : <TrendingDown className="text-red-500" size={20} />}
            isOverBudget={capitalOverview.remaining < 0}
            colorValue={true}
            isLoading={false}
          />
        </div>
      )}

      {/* How it works — concise flow banner */}
      {!isLoading && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">1. Log Income</span>
          <span className="text-slate-300 dark:text-slate-600">→</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400 shrink-0">2. Create Programs &amp; Set Budgets</span>
          <span className="text-slate-300 dark:text-slate-600">→</span>
          <span className="font-semibold text-red-500 shrink-0">3. Add Expenses to Programs</span>
          {unallocatedExpenses > 0 && (
            <>
              <span className="flex-1" />
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {formatIDR(unallocatedExpenses)} in general expenses (not linked to any program)
              </span>
            </>
          )}
        </div>
      )}

      {/* Action buttons row */}
      <div className="flex items-center gap-3">
        {isManager && (
          <>
            <button
              onClick={() => setActiveModal('logIncome')}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <TrendingUp size={16} />
              <span>Log Income</span>
            </button>
            <button
              onClick={() => setActiveModal('allocate')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Wallet size={16} />
              <span>New Program</span>
            </button>
          </>
        )}
        <div className="flex-1" />
        <button
          onClick={() => openAddExpense()}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg font-semibold text-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <PlusCircle size={16} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Program budget grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Program Budgets</h3>
          {!isLoading && (
            <span className="text-xs text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
              {programBudgetViewModels.length}
            </span>
          )}
          {!isLoading && totalAllocated > 0 && (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full ml-auto">
              {formatIDR(totalAllocated)} total allocated
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => <ProgramCardSkeleton key={i} />)}
          </div>
        ) : programBudgetViewModels.length === 0 ? (
          <EmptyState
            icon={<Building2 className="text-slate-400" size={24} />}
            title="No program budgets yet"
            description="Create your first program budget to start tracking allocations and spending."
            actionLabel="New Program Budget"
            onAction={() => setActiveModal('allocate')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {programBudgetViewModels.map((budget) => (
              <EventBudgetCard
                key={budget.id}
                budget={budget}
                isManager={isManager}
                onAddExpense={(budgetId) => openAddExpense(budgetId)}
                onEditExpense={openEditExpense}
                onDeleteExpense={deleteExpense}
                onUpdateAllocation={updateBudgetAllocation}
              />
            ))}
            {programBudgetViewModels.length === 1 && (
              <button
                onClick={() => setActiveModal('allocate')}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 min-h-[180px] text-slate-400 dark:text-slate-500 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 transition-all"
              >
                <PlusCircle size={24} className="mb-2" />
                <span className="text-sm font-medium">New program budget</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* All Transactions Table */}
      {!isLoading && transactions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <List size={18} className="text-slate-500 dark:text-slate-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Transactions</h3>
            <span className="text-xs text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
              {transactions.length}
            </span>
          </div>
          <TransactionTable
            transactions={transactions}
            programBudgets={programBudgets}
            isManager={isManager}
            onEditExpense={editExpense}
            onDeleteExpense={deleteExpense}
          />
        </div>
      )}

      {/* Modals — lazy-loaded, only mounted when open */}
      <Suspense fallback={null}>
        {activeModal === 'addExpense' && (
          <AddExpenseModal
            isOpen={true}
            onClose={closeModal}
            onSubmit={addExpense}
            programBudgets={programBudgets}
            defaultProgramBudgetId={preselectedBudgetId}
          />
        )}
        {activeModal === 'editExpense' && (
          <EditExpenseModal
            isOpen={true}
            isManager={isManager}
            expense={editingExpense}
            onClose={closeModal}
            onSubmit={editExpense}
            programBudgets={programBudgets}
          />
        )}
        {activeModal === 'logIncome' && (
          <LogIncomeModal
            isOpen={true}
            isManager={isManager}
            onClose={closeModal}
            onSubmit={logIncome}
          />
        )}
        {activeModal === 'allocate' && (
          <AllocateBudgetModal
            isOpen={true}
            isManager={isManager}
            programBudgets={programBudgets}
            onClose={closeModal}
            onUpdateAllocation={updateBudgetAllocation}
            onAddProgram={addProgramBudget}
          />
        )}
      </Suspense>
    </div>
  );
};

export default FinanceCapitalView;
