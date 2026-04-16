import { useCallback, useMemo, useState } from "react";
import type { DbFinanceProgramBudget, DbFinanceTransaction, User, ExpenseCategory } from "@/types";
import {
  DB_FINANCE_PROGRAM_BUDGETS,
  DB_FINANCE_TRANSACTIONS,
} from "@/constants";
import {
  getCapitalOverviewWithChange,
  getFinanceRole,
  getProgramBudgetViewModels,
  isFinanceManager,
  formatIDR,
} from "@/lib/finance";
import { useToast } from "@/components/shared/ToastProvider";

export interface AddExpenseData {
  title: string;
  amount: number;
  transactionDate: string;
  programBudgetId?: string;
  category?: ExpenseCategory;
}

export interface AddIncomeData {
  title: string;
  amount: number;
  transactionDate: string;
}

export type EditExpenseUpdates = Partial<
  Pick<DbFinanceTransaction, "title" | "amount" | "transactionDate" | "programBudgetId" | "category">
>;

export function useCapitalManagement(user: User) {
  const [transactions, setTransactions] = useState<DbFinanceTransaction[]>(
    DB_FINANCE_TRANSACTIONS
  );
  const [programBudgets, setProgramBudgets] = useState<DbFinanceProgramBudget[]>(
    DB_FINANCE_PROGRAM_BUDGETS
  );
  const { addToast } = useToast();

  const financeRole = useMemo(() => getFinanceRole(user), [user]);
  const isManager = useMemo(() => isFinanceManager(user), [user]);

  const capitalOverview = useMemo(
    () => getCapitalOverviewWithChange(transactions, programBudgets),
    [transactions, programBudgets]
  );

  const programBudgetViewModels = useMemo(
    () => getProgramBudgetViewModels(programBudgets, transactions),
    [programBudgets, transactions]
  );

  const addExpense = useCallback(
    (data: AddExpenseData) => {
      const newTransaction: DbFinanceTransaction = {
        id: `ft_${Date.now()}`,
        title: data.title,
        amount: data.amount,
        type: "expense",
        transactionDate: data.transactionDate,
        departmentId: "d_finance",
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        programBudgetId: data.programBudgetId,
        category: data.category,
      };
      setTransactions((prev) => [...prev, newTransaction]);
      addToast({
        type: 'success',
        title: 'Expense Added',
        message: `"${data.title}" has been recorded.`,
      });
    },
    [user.id, addToast]
  );

  const editExpense = useCallback(
    (id: string, updates: EditExpenseUpdates) => {
      if (!isFinanceManager(user)) return;
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
      addToast({
        type: 'success',
        title: 'Expense Updated',
        message: 'The expense has been updated successfully.',
      });
    },
    [user, addToast]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      if (!isFinanceManager(user)) return;
      const expense = transactions.find((t) => t.id === id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      addToast({
        type: 'success',
        title: 'Expense Deleted',
        message: `"${expense?.title || 'Expense'}" has been removed.`,
      });
    },
    [user, transactions, addToast]
  );

  const logIncome = useCallback(
    (data: AddIncomeData) => {
      if (!isFinanceManager(user)) return;
      const newIncome: DbFinanceTransaction = {
        id: `ft_${Date.now()}`,
        title: data.title,
        amount: data.amount,
        type: "income",
        transactionDate: data.transactionDate,
        departmentId: "d_finance",
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [...prev, newIncome]);
      addToast({
        type: 'success',
        title: 'Income Logged',
        message: `"${data.title}" has been added to your records.`,
      });
    },
    [user, addToast]
  );

  const updateBudgetAllocation = useCallback(
    (programBudgetId: string, newAmount: number) => {
      if (!isFinanceManager(user)) return;
      setProgramBudgets((prev) =>
        prev.map((b) =>
          b.id === programBudgetId ? { ...b, allocatedAmount: newAmount } : b
        )
      );
      addToast({
        type: 'success',
        title: 'Budget Updated',
        message: `Allocation has been updated to ${formatIDR(newAmount)}.`,
      });
    },
    [user, addToast]
  );

  const addProgramBudget = useCallback(
    (name: string, allocatedAmount: number) => {
      if (!isFinanceManager(user)) return;
      const newBudget: DbFinanceProgramBudget = {
        id: `pb_${Date.now()}`,
        name,
        allocatedAmount,
        departmentId: "d_finance",
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      };
      setProgramBudgets((prev) => [...prev, newBudget]);
      addToast({
        type: 'success',
        title: 'Program Created',
        message: `"${name}" has been added with ${formatIDR(allocatedAmount)} allocation.`,
      });
    },
    [user, addToast]
  );

  return {
    transactions,
    programBudgets,
    capitalOverview,
    programBudgetViewModels,
    financeRole,
    isManager,
    addExpense,
    editExpense,
    deleteExpense,
    logIncome,
    updateBudgetAllocation,
    addProgramBudget,
  };
}
