import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  ensureDepartmentAccess,
  ensureManagerRole,
} from "@/lib/server/auth-helper";
import { writeAuditLog } from "@/lib/server/audit";
import type { User, DbHrMember, HrMemberStatus } from "@/types";

export const createHrMemberSchema = z.object({
  userId: z.string().trim().min(1),
  position: z.string().trim().min(1).max(255),
  joinDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  status: z
    .enum(["active", "inactive", "probation", "on_leave"])
    .default("active"),
  departmentId: z.string().trim().min(1),
});

export const updateHrMemberSchema = z.object({
  position: z.string().trim().min(1).max(255).optional(),
  status: z
    .enum(["active", "inactive", "probation", "on_leave"])
    .optional(),
  joinDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Invalid date")
    .optional(),
});

function toDto(row: {
  id: string;
  userId: string;
  position: string;
  joinDate: Date;
  status: string;
  departmentId: string;
  createdAt: Date;
}): DbHrMember {
  return {
    id: row.id,
    userId: row.userId,
    position: row.position,
    joinDate: row.joinDate.toISOString().split("T")[0],
    status: row.status as HrMemberStatus,
    departmentId: row.departmentId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getHrMembers(
  departmentId: string | undefined,
  user: User
): Promise<DbHrMember[]> {
  if (departmentId) ensureDepartmentAccess(user, departmentId);

  const rows = await prisma.hrMember.findMany({
    where: departmentId ? { departmentId } : undefined,
    orderBy: { joinDate: "desc" },
  });
  return rows.map(toDto);
}

export async function createHrMember(
  input: z.infer<typeof createHrMemberSchema>,
  user: User
): Promise<DbHrMember> {
  ensureDepartmentAccess(user, input.departmentId);
  ensureManagerRole(user);

  const row = await prisma.hrMember.create({
    data: {
      userId: input.userId,
      position: input.position,
      joinDate: new Date(input.joinDate),
      status: input.status,
      departmentId: input.departmentId,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "create",
    resourceType: "HrMember",
    resourceId: row.id,
    payload: { position: row.position, departmentId: row.departmentId },
  });

  return toDto(row);
}

export async function updateHrMember(
  id: string,
  input: z.infer<typeof updateHrMemberSchema>,
  user: User
): Promise<DbHrMember> {
  const existing = await prisma.hrMember.findUniqueOrThrow({ where: { id } });
  ensureDepartmentAccess(user, existing.departmentId);
  ensureManagerRole(user);

  const row = await prisma.hrMember.update({
    where: { id },
    data: {
      ...(input.position && { position: input.position }),
      ...(input.status && { status: input.status }),
      ...(input.joinDate && { joinDate: new Date(input.joinDate) }),
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "update",
    resourceType: "HrMember",
    resourceId: id,
    payload: input as Record<string, unknown>,
  });

  return toDto(row);
}
