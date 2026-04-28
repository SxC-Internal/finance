import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  ensureDepartmentAccess,
  ensureManagerRole,
} from "@/lib/server/auth-helper";
import { writeAuditLog } from "@/lib/server/audit";
import type { User, DbAnalyticsReport, ReportStatus } from "@/types";

export const createReportSchema = z.object({
  id: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).max(255),
  fileUrl: z.string().max(2000).default(""),
  reportDate: z.string().max(50).default(""),
  fileSize: z.string().max(50).default(""),
  departmentId: z.string().trim().min(1),
});

function toDto(row: {
  id: string;
  title: string;
  fileUrl: string;
  reportDate: string;
  fileSize: string;
  status: string;
  departmentId: string;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
}): DbAnalyticsReport {
  return {
    id: row.id,
    title: row.title,
    fileUrl: row.fileUrl,
    reportDate: row.reportDate,
    fileSize: row.fileSize,
    status: row.status as ReportStatus,
    departmentId: row.departmentId,
    createdBy: row.createdBy,
    approvedBy: row.approvedBy ?? undefined,
    approvedAt: row.approvedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getReports(
  departmentId: string | undefined,
  user: User
): Promise<DbAnalyticsReport[]> {
  if (departmentId) ensureDepartmentAccess(user, departmentId);

  const rows = await prisma.analyticsReport.findMany({
    where: departmentId ? { departmentId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDto);
}

export async function getReportById(
  id: string,
  user: User
): Promise<DbAnalyticsReport | null> {
  const row = await prisma.analyticsReport.findUnique({ where: { id } });
  if (!row) return null;
  ensureDepartmentAccess(user, row.departmentId);
  return toDto(row);
}

export async function createReport(
  input: z.infer<typeof createReportSchema>,
  user: User
): Promise<DbAnalyticsReport> {
  ensureDepartmentAccess(user, input.departmentId);

  const row = await prisma.analyticsReport.create({
    data: {
      ...(input.id ? { id: input.id } : {}),
      title: input.title,
      fileUrl: input.fileUrl,
      reportDate: input.reportDate,
      fileSize: input.fileSize,
      departmentId: input.departmentId,
      createdBy: user.id,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "create",
    resourceType: "AnalyticsReport",
    resourceId: row.id,
    payload: { title: row.title, departmentId: row.departmentId },
  });

  return toDto(row);
}

export async function approveReport(
  id: string,
  user: User
): Promise<DbAnalyticsReport> {
  const existing = await prisma.analyticsReport.findUniqueOrThrow({
    where: { id },
  });
  ensureDepartmentAccess(user, existing.departmentId);
  ensureManagerRole(user);

  const row = await prisma.analyticsReport.update({
    where: { id },
    data: { status: "approved", approvedBy: user.id, approvedAt: new Date() },
  });

  await writeAuditLog({
    userId: user.id,
    action: "approve",
    resourceType: "AnalyticsReport",
    resourceId: id,
  });

  return toDto(row);
}

export async function revokeReport(
  id: string,
  user: User
): Promise<DbAnalyticsReport> {
  const existing = await prisma.analyticsReport.findUniqueOrThrow({
    where: { id },
  });
  ensureDepartmentAccess(user, existing.departmentId);
  ensureManagerRole(user);

  const row = await prisma.analyticsReport.update({
    where: { id },
    data: { status: "pending", approvedBy: null, approvedAt: null },
  });

  await writeAuditLog({
    userId: user.id,
    action: "revoke",
    resourceType: "AnalyticsReport",
    resourceId: id,
  });

  return toDto(row);
}
