import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/server/audit";
import type { User } from "@/types";

export const createDepartmentSchema = z.object({
  id: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(255),
  slug: z.string().trim().min(1).max(50),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  slug: z.string().trim().min(1).max(50).optional(),
});

export interface DepartmentDto {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

function toDto(dept: {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}): DepartmentDto {
  return {
    id: dept.id,
    name: dept.name,
    slug: dept.slug,
    createdAt: dept.createdAt.toISOString(),
  };
}

function ensureAdmin(user: User): void {
  if (user.role !== "admin") {
    throw new Error("Forbidden: admin role required");
  }
}

export async function getDepartments(): Promise<DepartmentDto[]> {
  const rows = await prisma.department.findMany({ orderBy: { name: "asc" } });
  return rows.map(toDto);
}

export async function getDepartmentBySlug(
  slug: string
): Promise<DepartmentDto | null> {
  const dept = await prisma.department.findUnique({ where: { slug } });
  return dept ? toDto(dept) : null;
}

export async function createDepartment(
  input: z.infer<typeof createDepartmentSchema>,
  user: User
): Promise<DepartmentDto> {
  ensureAdmin(user);

  const dept = await prisma.department.create({ data: input });

  await writeAuditLog({
    userId: user.id,
    action: "create",
    resourceType: "Department",
    resourceId: dept.id,
    payload: { name: dept.name, slug: dept.slug },
  });

  return toDto(dept);
}

export async function updateDepartment(
  id: string,
  input: z.infer<typeof updateDepartmentSchema>,
  user: User
): Promise<DepartmentDto> {
  ensureAdmin(user);

  const dept = await prisma.department.update({ where: { id }, data: input });

  await writeAuditLog({
    userId: user.id,
    action: "update",
    resourceType: "Department",
    resourceId: dept.id,
    payload: input as Record<string, unknown>,
  });

  return toDto(dept);
}
