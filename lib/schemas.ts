import { z } from 'zod';

const positiveAmount = z
  .string()
  .min(1, 'Amount is required')
  .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Amount must be a positive number');

const requiredString = (label: string) =>
  z.string().min(1, `${label} is required`).max(255);

export const addExpenseSchema = z.object({
  title: requiredString('Title'),
  amount: positiveAmount,
  date: z.string().min(1, 'Date is required'),
  category: z.string().optional(),
});

export const editExpenseSchema = z.object({
  title: requiredString('Title'),
  amount: positiveAmount,
  date: z.string().min(1, 'Date is required'),
  programBudgetId: z.string().optional(),
  category: z.string().optional(),
});

export const logIncomeSchema = z.object({
  title: requiredString('Title'),
  amount: positiveAmount,
  date: z.string().min(1, 'Date is required'),
});

export const adjustBudgetSchema = z.object({
  newAllocation: positiveAmount,
});

export const newProgramSchema = z.object({
  programName: requiredString('Program name'),
  initialAllocation: positiveAmount,
});
