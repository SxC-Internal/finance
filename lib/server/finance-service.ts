import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { DB_FINANCE_TRANSACTIONS, DB_FINANCE_PROGRAM_BUDGETS } from "@/constants";
import type { DbFinanceTransaction, DbFinanceProgramBudget, User } from "@/types";

export const createTransactionSchema = z.object({
  title: z.string().trim().min(1).max(255),
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  transactionDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  departmentId: z.string().trim().min(1),
  category: z.string().optional(),
  programBudgetId: z.string().optional(),
});

export const createBudgetSchema = z.object({
  name: z.string().trim().min(1).max(255),
  allocatedAmount: z.number().positive(),
  departmentId: z.string().trim().min(1),
  endDate: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    "Invalid date"
  ),
});

export const updateBudgetSchema = z.object({
  budgetId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(255).optional(),
  allocatedAmount: z.number().positive().optional(),
  endDate: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    "Invalid date"
  ),
});

type FinanceMemoryStore = {
  transactions: DbFinanceTransaction[];
  budgets: DbFinanceProgramBudget[];
};

const initialMemoryStore: FinanceMemoryStore = {
  transactions: DB_FINANCE_TRANSACTIONS.map((tx) => ({ ...tx })),
  budgets: DB_FINANCE_PROGRAM_BUDGETS.map((budget) => ({ ...budget })),
};

let memoryStore: FinanceMemoryStore = {
  transactions: initialMemoryStore.transactions,
  budgets: initialMemoryStore.budgets,
};

let loggedPrismaFallback = false;
let nextPrismaRetryAt = 0;
const PRISMA_RETRY_BACKOFF_MS = 15_000;
const allowMemoryFallback =
  process.env.NODE_ENV === "development" ||
  process.env.ALLOW_FINANCE_MEMORY_FALLBACK === "true";

function isPrismaConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") {
    return true;
  }

  return error instanceof Error && error.message.includes("Can't reach database server");
}

function ensureFinanceManager(user: User): void {
  if (user.role === "admin") return;
  if (user.membershipRole !== "manager") {
    throw new Error("Forbidden: manager role required");
  }
}

function ensureDepartmentAccess(user: User, departmentId: string): void {
  if (user.role === "admin") return;
  const userDepartmentId = user.departmentId ?? `d_${user.role}`;
  if (userDepartmentId !== departmentId) {
    throw new Error("Forbidden: cross-department access is not allowed");
  }
}

async function withPrismaFallback<T>(
  operation: () => Promise<T>,
  fallbackOperation: () => T | Promise<T>
): Promise<T> {
  if (allowMemoryFallback && Date.now() < nextPrismaRetryAt) {
    return await fallbackOperation();
  }

  try {
    const result = await operation();
    nextPrismaRetryAt = 0;
    return result;
  } catch (error) {
    if (!isPrismaConnectionError(error)) {
      throw error;
    }

    if (!allowMemoryFallback) {
      throw new Error("Service unavailable: finance database is unreachable");
    }

    nextPrismaRetryAt = Date.now() + PRISMA_RETRY_BACKOFF_MS;

    if (!loggedPrismaFallback) {
      loggedPrismaFallback = true;
      console.warn("[finance-service] Prisma unavailable, using in-memory fallback store for local development");
    }

    return await fallbackOperation();
  }
}

function makeMemoryId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function toTransactionDto(tx: {
  id: string;
  title: string;
  amount: number;
  type: string;
  transactionDate: string | Date;
  departmentId: string;
  createdBy: string;
  createdAt: string | Date;
  programBudgetId?: string | null;
  category?: string | null;
}): DbFinanceTransaction {
  return {
    id: tx.id,
    title: tx.title,
    amount: tx.amount,
    type: tx.type as "income" | "expense",
    transactionDate: typeof tx.transactionDate === "string" ? tx.transactionDate : tx.transactionDate.toISOString().split("T")[0],
    departmentId: tx.departmentId,
    createdBy: tx.createdBy,
    createdAt: typeof tx.createdAt === "string" ? tx.createdAt : tx.createdAt.toISOString(),
    programBudgetId: tx.programBudgetId ?? undefined,
    category: (tx.category as any) ?? undefined,
  };
}

function toBudgetDto(budget: {
  id: string;
  name: string;
  allocatedAmount: number;
  departmentId: string;
  createdBy: string;
  createdAt: string | Date;
  endDate?: string | Date | null;
}): DbFinanceProgramBudget {
  return {
    id: budget.id,
    name: budget.name,
    allocatedAmount: budget.allocatedAmount,
    departmentId: budget.departmentId,
    createdBy: budget.createdBy,
    createdAt: typeof budget.createdAt === "string" ? budget.createdAt : budget.createdAt.toISOString(),
    endDate: budget.endDate
      ? typeof budget.endDate === "string"
        ? budget.endDate
        : budget.endDate.toISOString()
      : undefined,
  };
}

export async function getTransactions(
  departmentId: string,
  user: User,
  filters?: {
    startDate?: string;
    endDate?: string;
    type?: "income" | "expense";
  }
): Promise<DbFinanceTransaction[]> {
  ensureDepartmentAccess(user, departmentId);

  return withPrismaFallback(
    async () => {
      const where: Prisma.FinanceTransactionWhereInput = {
        departmentId,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.startDate && {
          transactionDate: { gte: new Date(filters.startDate) },
        }),
        ...(filters?.endDate && {
          transactionDate: { ...((filters?.startDate ? { gte: new Date(filters.startDate) } : {})), lte: new Date(filters.endDate) },
        }),
      };

      const transactions = await prisma.financeTransaction.findMany({
        where,
        orderBy: { transactionDate: "desc" },
      });

      return transactions.map(toTransactionDto);
    },
    () => {
      return memoryStore.transactions
        .filter((tx) => {
          if (tx.departmentId !== departmentId) return false;
          if (filters?.type && tx.type !== filters.type) return false;
          if (filters?.startDate && tx.transactionDate < filters.startDate) return false;
          if (filters?.endDate && tx.transactionDate > filters.endDate) return false;
          return true;
        })
        .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
    }
  );
}

export async function createTransaction(
  input: z.infer<typeof createTransactionSchema>,
  user: User
): Promise<DbFinanceTransaction> {
  ensureDepartmentAccess(user, input.departmentId);
  ensureFinanceManager(user);

  return withPrismaFallback(
    async () => {
      const created = await prisma.financeTransaction.create({
        data: {
          title: input.title,
          amount: Math.round(input.amount),
          type: input.type,
          transactionDate: new Date(input.transactionDate),
          departmentId: input.departmentId,
          createdBy: user.id,
          category: input.category,
          programBudgetId: input.programBudgetId,
        },
      });

      return toTransactionDto(created);
    },
    () => {
      const newTransaction: DbFinanceTransaction = {
        id: makeMemoryId("ft"),
        title: input.title,
        amount: Math.round(input.amount),
        type: input.type,
        transactionDate: input.transactionDate,
        departmentId: input.departmentId,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        category: (input.category as any),
        programBudgetId: input.programBudgetId,
      };

      memoryStore = {
        transactions: [newTransaction, ...memoryStore.transactions],
        budgets: memoryStore.budgets,
      };

      return newTransaction;
    }
  );
}

export async function getBudgets(
  departmentId: string,
  user: User
): Promise<DbFinanceProgramBudget[]> {
  ensureDepartmentAccess(user, departmentId);

  return withPrismaFallback(
    async () => {
      const budgets = await prisma.financeProgramBudget.findMany({
        where: { departmentId },
        orderBy: { createdAt: "desc" },
      });

      return budgets.map(toBudgetDto);
    },
    () => {
      return memoryStore.budgets
        .filter((budget) => budget.departmentId === departmentId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  );
}

export async function getBudgetById(
  budgetId: string,
  user: User
): Promise<DbFinanceProgramBudget | null> {
  return withPrismaFallback(
    async () => {
      const budget = await prisma.financeProgramBudget.findUnique({
        where: { id: budgetId },
      });

      if (!budget) return null;

      ensureDepartmentAccess(user, budget.departmentId);
      return toBudgetDto(budget);
    },
    () => {
      const budget = memoryStore.budgets.find((b) => b.id === budgetId);
      if (!budget) return null;

      ensureDepartmentAccess(user, budget.departmentId);
      return budget;
    }
  );
}

export async function createBudget(
  input: z.infer<typeof createBudgetSchema>,
  user: User
): Promise<DbFinanceProgramBudget> {
  ensureDepartmentAccess(user, input.departmentId);
  ensureFinanceManager(user);

  return withPrismaFallback(
    async () => {
      const created = await prisma.financeProgramBudget.create({
        data: {
          name: input.name,
          allocatedAmount: Math.round(input.allocatedAmount),
          departmentId: input.departmentId,
          createdBy: user.id,
          endDate: input.endDate ? new Date(input.endDate) : null,
        },
      });

      return toBudgetDto(created);
    },
    () => {
      const newBudget: DbFinanceProgramBudget = {
        id: makeMemoryId("pb"),
        name: input.name,
        allocatedAmount: Math.round(input.allocatedAmount),
        departmentId: input.departmentId,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        endDate: input.endDate,
      };

      memoryStore = {
        transactions: memoryStore.transactions,
        budgets: [newBudget, ...memoryStore.budgets],
      };

      return newBudget;
    }
  );
}

export async function updateBudget(
  input: z.infer<typeof updateBudgetSchema>,
  user: User
): Promise<DbFinanceProgramBudget> {
  return withPrismaFallback(
    async () => {
      const budget = await prisma.financeProgramBudget.findUnique({
        where: { id: input.budgetId },
      });

      if (!budget) {
        throw new Error("Budget not found");
      }

      ensureDepartmentAccess(user, budget.departmentId);
      ensureFinanceManager(user);

      const updated = await prisma.financeProgramBudget.update({
        where: { id: input.budgetId },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.allocatedAmount && { allocatedAmount: Math.round(input.allocatedAmount) }),
          ...(input.endDate && { endDate: new Date(input.endDate) }),
        },
      });

      return toBudgetDto(updated);
    },
    () => {
      const budget = memoryStore.budgets.find((b) => b.id === input.budgetId);

      if (!budget) {
        throw new Error("Budget not found");
      }

      ensureDepartmentAccess(user, budget.departmentId);
      ensureFinanceManager(user);

      const updated: DbFinanceProgramBudget = {
        ...budget,
        ...(input.name && { name: input.name }),
        ...(input.allocatedAmount && { allocatedAmount: Math.round(input.allocatedAmount) }),
        ...(input.endDate && { endDate: input.endDate }),
      };

      memoryStore = {
        transactions: memoryStore.transactions,
        budgets: memoryStore.budgets.map((b) => (b.id === input.budgetId ? updated : b)),
      };

      return updated;
    }
  );
}

export function isFallbackActive(): boolean {
  return allowMemoryFallback && nextPrismaRetryAt > 0 && Date.now() < nextPrismaRetryAt;
}
