import { create } from 'zustand';
import type { DbFinanceTransaction, DbFinanceProgramBudget } from '@/types';
import { DB_FINANCE_TRANSACTIONS, DB_FINANCE_PROGRAM_BUDGETS } from '@/constants';

interface CapitalState {
  transactions: DbFinanceTransaction[];
  programBudgets: DbFinanceProgramBudget[];
  setTransactions: (transactions: DbFinanceTransaction[]) => void;
  setProgramBudgets: (budgets: DbFinanceProgramBudget[]) => void;
}

export const useCapitalStore = create<CapitalState>((set) => ({
  transactions: DB_FINANCE_TRANSACTIONS,
  programBudgets: DB_FINANCE_PROGRAM_BUDGETS,
  setTransactions: (transactions) => set({ transactions }),
  setProgramBudgets: (programBudgets) => set({ programBudgets }),
}));
