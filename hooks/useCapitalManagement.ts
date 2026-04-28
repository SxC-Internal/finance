import { useCallback, useMemo } from "react";
import type { DbFinanceProgramBudget, DbFinanceTransaction, User, ExpenseCategory } from "@/types";
import {
  getCapitalOverviewWithChange,
  getFinanceRole,
  getProgramBudgetViewModels,
  isFinanceManager,
  formatIDR,
} from "@/lib/finance";
import { useToast } from "@/components/shared/ToastProvider";
import { useQuery } from "@/hooks/useQuery";
import { useCapitalStore } from "@/store/capitalStore";

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
  const transactions = useCapitalStore((s) => s.transactions);
  const programBudgets = useCapitalStore((s) => s.programBudgets);
  const setTransactions = useCapitalStore((s) => s.setTransactions);
  const setProgramBudgets = useCapitalStore((s) => s.setProgramBudgets);
  const { addToast } = useToast();

  const departmentId = user.departmentId ?? `d_${user.role}`;

  const fetchTransactions = useCallback(async () => {
    const response = await fetch(
      `/api/finance/transactions?departmentId=${encodeURIComponent(departmentId)}`
    );
    if (!response.ok) throw new Error("Failed to load transactions");
    const result = await response.json();
    return (result.data ?? []) as DbFinanceTransaction[];
  }, [departmentId]);

  const fetchBudgets = useCallback(async () => {
    const response = await fetch(
      `/api/finance/budgets?departmentId=${encodeURIComponent(departmentId)}`
    );
    if (!response.ok) throw new Error("Failed to load budgets");
    const result = await response.json();
    return (result.data ?? []) as DbFinanceProgramBudget[];
  }, [departmentId]);

  const { loading: isLoadingTransactions, error: txError } = useQuery(
    `capital-transactions-${departmentId}`,
    fetchTransactions,
    { onSuccess: setTransactions }
  );
  const { loading: isLoadingBudgets, error: budgetErr } = useQuery(
    `capital-budgets-${departmentId}`,
    fetchBudgets,
    { onSuccess: setProgramBudgets }
  );

  const transactionError = txError?.message ?? null;
  const budgetError = budgetErr?.message ?? null;

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
    async (data: AddExpenseData) => {
      try {
        const response = await fetch("/api/finance/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            amount: data.amount,
            type: "expense",
            transactionDate: data.transactionDate,
            departmentId,
            category: data.category,
            programBudgetId: data.programBudgetId,
          }),
        });
        if (!response.ok) throw new Error("Failed to add expense");
        const result = await response.json();
        setTransactions([result.data, ...useCapitalStore.getState().transactions]);
        addToast({ type: "success", title: "Expense Added", message: `"${data.title}" has been recorded.` });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error adding expense";
        addToast({ type: "error", title: "Error", message });
      }
    },
    [departmentId, addToast, setTransactions]
  );

  const editExpense = useCallback(
    async (id: string, updates: EditExpenseUpdates) => {
      if (!isFinanceManager(user)) return;
      setTransactions(useCapitalStore.getState().transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      addToast({ type: "success", title: "Expense Updated", message: "The expense has been updated successfully." });
    },
    [user, addToast, setTransactions]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!isFinanceManager(user)) return;
      const current = useCapitalStore.getState().transactions;
      const expense = current.find((t) => t.id === id);
      setTransactions(current.filter((t) => t.id !== id));
      addToast({ type: "success", title: "Expense Deleted", message: `"${expense?.title ?? "Expense"}" has been removed.` });
    },
    [user, addToast, setTransactions]
  );

  const logIncome = useCallback(
    async (data: AddIncomeData) => {
      if (!isFinanceManager(user)) return;
      try {
        const response = await fetch("/api/finance/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            amount: data.amount,
            type: "income",
            transactionDate: data.transactionDate,
            departmentId,
          }),
        });
        if (!response.ok) throw new Error("Failed to log income");
        const result = await response.json();
        setTransactions([result.data, ...useCapitalStore.getState().transactions]);
        addToast({ type: "success", title: "Income Logged", message: `"${data.title}" has been added to your records.` });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error logging income";
        addToast({ type: "error", title: "Error", message });
      }
    },
    [user, departmentId, addToast, setTransactions]
  );

  const updateBudgetAllocation = useCallback(
    async (programBudgetId: string, newAmount: number) => {
      if (!isFinanceManager(user)) return;
      try {
        const response = await fetch(`/api/finance/budgets/${encodeURIComponent(programBudgetId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allocatedAmount: newAmount }),
        });
        if (!response.ok) throw new Error("Failed to update budget");
        const result = await response.json();
        setProgramBudgets(useCapitalStore.getState().programBudgets.map((b) => (b.id === programBudgetId ? result.data : b)));
        addToast({ type: "success", title: "Budget Updated", message: `Allocation has been updated to ${formatIDR(newAmount)}.` });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error updating budget";
        addToast({ type: "error", title: "Error", message });
      }
    },
    [user, addToast, setProgramBudgets]
  );

  const addProgramBudget = useCallback(
    async (name: string, allocatedAmount: number) => {
      if (!isFinanceManager(user)) return;
      try {
        const response = await fetch("/api/finance/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, allocatedAmount, departmentId }),
        });
        if (!response.ok) throw new Error("Failed to create budget");
        const result = await response.json();
        setProgramBudgets([result.data, ...useCapitalStore.getState().programBudgets]);
        addToast({ type: "success", title: "Program Created", message: `"${name}" has been added with ${formatIDR(allocatedAmount)} allocation.` });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error creating program";
        addToast({ type: "error", title: "Error", message });
      }
    },
    [user, departmentId, addToast, setProgramBudgets]
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
    isLoadingTransactions,
    isLoadingBudgets,
    transactionError,
    budgetError,
  };
}
