import type {
  User,
  FinanceRole,
  DbFinanceTransaction,
  DbFinanceProgramBudget,
  DbEmailBlast,
  ExpenseCategory,
  FinancialChartDatum,
  EmailMetricsTimeSeries,
  BudgetAlert,
  ProgramBudgetViewModel,
  CapitalOverviewViewModel,
  ActivityFeedItem,
} from "@/types";

export function getFinanceRole(user: User): FinanceRole | null {
  if (user.role !== "finance") return null;
  if (user.membershipRole === "manager" || user.membershipRole === "head") return "manager";
  if (user.membershipRole === "member") return "associate";
  return null;
}

export function isFinanceManager(user: User): boolean {
  return getFinanceRole(user) === "manager";
}

export function isOverBudget(allocated: number, spent: number): boolean {
  return spent > allocated;
}

export function formatIDR(amount: number): string {
  return "Rp " + amount.toLocaleString("id-ID");
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function getUtilizationPercentage(allocated: number, spent: number): number {
  if (allocated === 0) return 0;
  return Math.round((spent / allocated) * 100);
}

export function getDaysRemaining(endDate?: string): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getCashRunway(monthlyExpenses: number, remainingBalance: number): number {
  if (monthlyExpenses === 0) return Number.POSITIVE_INFINITY;
  return remainingBalance / monthlyExpenses;
}

export interface CapitalOverviewWithChange extends CapitalOverviewViewModel {
  incomeChangePercent: number;
  expenseChangePercent: number;
  previousPeriodIncome: number;
  previousPeriodExpenses: number;
  averageMonthlyExpenses: number;
}

export function getCapitalOverviewWithChange(
  transactions: DbFinanceTransaction[],
  budgets: DbFinanceProgramBudget[]
): CapitalOverviewWithChange {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const currentIncome = transactions
    .filter((t) => t.type === "income" && new Date(t.transactionDate) >= thirtyDaysAgo)
    .reduce((sum, t) => sum + t.amount, 0);

  const previousIncome = transactions
    .filter((t) => t.type === "income" && new Date(t.transactionDate) < thirtyDaysAgo)
    .reduce((sum, t) => sum + t.amount, 0);

  const currentExpenses = transactions
    .filter((t) => t.type === "expense" && new Date(t.transactionDate) >= thirtyDaysAgo)
    .reduce((sum, t) => sum + t.amount, 0);

  const previousExpenses = transactions
    .filter((t) => t.type === "expense" && new Date(t.transactionDate) < thirtyDaysAgo)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);

  const incomeChangePercent = previousIncome === 0 ? 0 : ((currentIncome - previousIncome) / previousIncome) * 100;
  const expenseChangePercent = previousExpenses === 0 ? 0 : ((currentExpenses - previousExpenses) / previousExpenses) * 100;

  // Calculate average monthly expenses over last 6 months
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const recentExpenses = transactions
    .filter((t) => t.type === "expense" && new Date(t.transactionDate) >= sixMonthsAgo)
    .reduce((sum, t) => sum + t.amount, 0);
  const averageMonthlyExpenses = recentExpenses > 0 ? recentExpenses / 6 : 0;

  return {
    totalIncome,
    totalExpenses,
    totalAllocated,
    remaining: totalIncome - totalExpenses,
    incomeChangePercent,
    expenseChangePercent,
    previousPeriodIncome: previousIncome,
    previousPeriodExpenses: previousExpenses,
    averageMonthlyExpenses,
  };
}

export function getMonthlyChartData(
  transactions: DbFinanceTransaction[],
  months: number = 6
): FinancialChartDatum[] {
  const now = new Date();
  const data: FinancialChartDatum[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const monthIncome = transactions
      .filter((t) => {
        const date = new Date(t.transactionDate);
        return t.type === "income" && date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const monthExpenses = transactions
      .filter((t) => {
        const date = new Date(t.transactionDate);
        return t.type === "expense" && date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    data.push({
      month: monthLabel,
      income: monthIncome,
      expenses: monthExpenses,
      net: monthIncome - monthExpenses,
    });
  }

  return data;
}

export function getProgramBudgetViewModels(
  budgets: DbFinanceProgramBudget[],
  transactions: DbFinanceTransaction[]
): ProgramBudgetViewModel[] {
  const expensesByBudget = transactions
    .filter((t) => t.type === "expense" && t.programBudgetId != null)
    .reduce<Record<string, DbFinanceTransaction[]>>((acc, t) => {
      const key = t.programBudgetId!;
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {});

  return [...budgets]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((budget) => {
      const expenses = expensesByBudget[budget.id] ?? [];
      const spent = expenses.reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.allocatedAmount - spent;
      const utilizationPercentage = getUtilizationPercentage(budget.allocatedAmount, spent);

      return {
        id: budget.id,
        name: budget.name,
        allocatedAmount: budget.allocatedAmount,
        spent,
        remaining,
        expenses,
        isOverBudget: isOverBudget(budget.allocatedAmount, spent),
        endDate: budget.endDate,
        utilizationPercentage,
      };
    });
}

export function getProgramAllocationData(
  budgets: DbFinanceProgramBudget[],
  transactions: DbFinanceTransaction[]
): Array<{ name: string; value: number; color: string }> {
  const viewModels = getProgramBudgetViewModels(budgets, transactions);
  const colors = [
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
  ];

  return viewModels.map((vm, index) => ({
    name: vm.name,
    value: vm.allocatedAmount, // total allocated budget
    color: colors[index % colors.length],
  }));
}

export function getExpenseCategoryBreakdown(
  expenses: DbFinanceTransaction[]
): Array<{ category: ExpenseCategory; amount: number; count: number }> {
  const categories: ExpenseCategory[] = [
    'Marketing',
    'Operations',
    'Venue',
    'Catering',
    'Equipment',
    'Travel',
    'Other'
  ];

  const breakdown = expenses.reduce<
    Record<string, { amount: number; count: number }>
  >((acc, expense) => {
    const category = expense.category || 'Other';
    if (!acc[category]) {
      acc[category] = { amount: 0, count: 0 };
    }
    acc[category].amount += expense.amount;
    acc[category].count += 1;
    return acc;
  }, {});

  return categories
    .filter((cat) => breakdown[cat])
    .map((category) => ({
      category,
      amount: breakdown[category].amount,
      count: breakdown[category].count,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function getActivityFeed(
  transactions: DbFinanceTransaction[],
  blasts: DbEmailBlast[],
  users: User[],
  limit: number = 10
): ActivityFeedItem[] {
  const activities: ActivityFeedItem[] = [];

  // Add transactions
  transactions.forEach((tx) => {
    const user = users.find((u) => u.id === tx.createdBy);
    const action: ActivityFeedItem['action'] = tx.type === 'income' ? 'income' : 'expense';
    activities.push({
      id: `tx-${tx.id}`,
      user: user?.name || 'Unknown',
      userAvatar: user?.avatar || '',
      action,
      target: tx.title,
      time: new Date(tx.createdAt).toLocaleString(),
      timestamp: new Date(tx.createdAt),
      metadata: { amount: tx.amount },
    });
  });

  // Add email blasts
  blasts.forEach((blast) => {
    const composer = users.find((u) => u.id === blast.composedBy);
    let action: ActivityFeedItem['action'];
    switch (blast.status) {
      case 'sent':
        action = 'blast_sent';
        break;
      case 'approved':
        action = 'blast_approved';
        break;
      case 'rejected':
        action = 'blast_rejected';
        break;
      default:
        return; // skip other statuses
    }
    activities.push({
      id: `blast-${blast.id}`,
      user: composer?.name || 'Unknown',
      userAvatar: composer?.avatar || '',
      action,
      target: blast.subject,
      time: blast.sentAt ? new Date(blast.sentAt).toLocaleString() : new Date(blast.createdAt).toLocaleString(),
      timestamp: blast.sentAt ? new Date(blast.sentAt) : new Date(blast.createdAt),
      metadata: {
        status: blast.status,
      },
    });
  });

  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

export function getSparklineData(
  transactions: DbFinanceTransaction[],
  days: number = 30
): { date: string; value: number }[] {
  const now = new Date();
  const data: { date: string; value: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const dayTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.transactionDate);
      return (
        txDate.getDate() === date.getDate() &&
        txDate.getMonth() === date.getMonth() &&
        txDate.getFullYear() === date.getFullYear()
      );
    });

    const dailyTotal = dayTransactions.reduce((sum, tx) => {
      return tx.type === 'income' ? sum + tx.amount : sum - tx.amount;
    }, 0);

    data.push({ date: dateStr, value: dailyTotal });
  }

  return data;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export function getBudgetAlerts(
  viewModels: ProgramBudgetViewModel[]
): BudgetAlert[] {
  return viewModels
    .filter((vm) => vm.isOverBudget || vm.utilizationPercentage > 85)
    .map((vm) => ({
      type: vm.isOverBudget ? 'over_budget' : 'low_balance',
      programBudgetId: vm.id,
      programName: vm.name,
      severity: vm.isOverBudget ? 'high' : 'medium',
    }));
}

// Category mapping for consistent colors
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Marketing: '#3b82f6', // blue-500
  Operations: '#6b7280', // gray-500
  Venue: '#8b5cf6', // violet-500
  Catering: '#f59e0b', // amber-500
  Equipment: '#10b981', // emerald-500
  Travel: '#ec4899', // pink-500
  Other: '#6b7280', // gray-500
};
