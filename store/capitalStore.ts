import { create } from 'zustand';
import type { DbFinanceTransaction, DbFinanceProgramBudget } from '@/types';

interface CapitalState {
  transactions: DbFinanceTransaction[];
  programBudgets: DbFinanceProgramBudget[];
  setTransactions: (transactions: DbFinanceTransaction[]) => void;
  setProgramBudgets: (budgets: DbFinanceProgramBudget[]) => void;
}

export const useCapitalStore = create<CapitalState>((set) => ({
  transactions: [],
  programBudgets: [],
  setTransactions: (transactions) => set({ transactions }),
  setProgramBudgets: (programBudgets) => set({ programBudgets }),
}));
