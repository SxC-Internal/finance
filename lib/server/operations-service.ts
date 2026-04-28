import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  ensureDepartmentAccess,
  ensureManagerRole,
} from "@/lib/server/auth-helper";
import { writeAuditLog } from "@/lib/server/audit";
import type { User, DbOperationsTask, OperationsTaskStatus } from "@/types";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(255),
  status: z.enum(["todo", "in_progress", "blocked", "done"]).default("todo"),
  deadline: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  assignedTo: z.string().trim().min(1),
  departmentId: z.string().trim().min(1),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  status: z.enum(["todo", "in_progress", "blocked", "done"]).optional(),
  deadline: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Invalid date")
    .optional(),
  assignedTo: z.string().trim().min(1).optional(),
});

function toDto(row: {
  id: string;
  title: string;
  status: string;
  deadline: Date;
  assignedTo: string;
  departmentId: string;
  createdAt: Date;
}): DbOperationsTask {
  return {
    id: row.id,
    title: row.title,
    status: row.status as OperationsTaskStatus,
    deadline: row.deadline.toISOString().split("T")[0],
    assignedTo: row.assignedTo,
    departmentId: row.departmentId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getTasks(
  departmentId: string | undefined,
  user: User
): Promise<DbOperationsTask[]> {
  if (departmentId) ensureDepartmentAccess(user, departmentId);

  const rows = await prisma.operationsTask.findMany({
    where: departmentId ? { departmentId } : undefined,
    orderBy: { deadline: "asc" },
  });
  return rows.map(toDto);
}

export async function createTask(
  input: z.infer<typeof createTaskSchema>,
  user: User
): Promise<DbOperationsTask> {
  ensureDepartmentAccess(user, input.departmentId);
  ensureManagerRole(user);

  const row = await prisma.operationsTask.create({
    data: {
      title: input.title,
      status: input.status,
      deadline: new Date(input.deadline),
      assignedTo: input.assignedTo,
      departmentId: input.departmentId,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "create",
    resourceType: "OperationsTask",
    resourceId: row.id,
    payload: { title: row.title, departmentId: row.departmentId },
  });

  return toDto(row);
}

export async function updateTask(
  id: string,
  input: z.infer<typeof updateTaskSchema>,
  user: User
): Promise<DbOperationsTask> {
  const existing = await prisma.operationsTask.findUniqueOrThrow({
    where: { id },
  });
  ensureDepartmentAccess(user, existing.departmentId);
  ensureManagerRole(user);

  const row = await prisma.operationsTask.update({
    where: { id },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.status && { status: input.status }),
      ...(input.deadline && { deadline: new Date(input.deadline) }),
      ...(input.assignedTo && { assignedTo: input.assignedTo }),
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "update",
    resourceType: "OperationsTask",
    resourceId: id,
    payload: input as Record<string, unknown>,
  });

  return toDto(row);
}
