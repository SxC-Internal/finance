import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  ensureDepartmentAccess,
  ensureManagerRole,
} from "@/lib/server/auth-helper";
import { writeAuditLog } from "@/lib/server/audit";
import type { User, DbMarketingCampaign } from "@/types";

export const createCampaignSchema = z.object({
  name: z.string().trim().min(1).max(255),
  platform: z.string().trim().min(1).max(100),
  budget: z.number().nonnegative(),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  endDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  departmentId: z.string().trim().min(1),
});

export const updateCampaignSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  platform: z.string().trim().min(1).max(100).optional(),
  budget: z.number().nonnegative().optional(),
  startDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Invalid date")
    .optional(),
  endDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Invalid date")
    .optional(),
});

function toDto(row: {
  id: string;
  name: string;
  platform: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  departmentId: string;
  createdAt: Date;
}): DbMarketingCampaign {
  return {
    id: row.id,
    name: row.name,
    platform: row.platform,
    budget: row.budget,
    startDate: row.startDate.toISOString().split("T")[0],
    endDate: row.endDate.toISOString().split("T")[0],
    departmentId: row.departmentId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getCampaigns(
  departmentId: string | undefined,
  user: User
): Promise<DbMarketingCampaign[]> {
  if (departmentId) ensureDepartmentAccess(user, departmentId);

  const rows = await prisma.marketingCampaign.findMany({
    where: departmentId ? { departmentId } : undefined,
    orderBy: { startDate: "desc" },
  });
  return rows.map(toDto);
}

export async function createCampaign(
  input: z.infer<typeof createCampaignSchema>,
  user: User
): Promise<DbMarketingCampaign> {
  ensureDepartmentAccess(user, input.departmentId);
  ensureManagerRole(user);

  const row = await prisma.marketingCampaign.create({
    data: {
      name: input.name,
      platform: input.platform,
      budget: input.budget,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      departmentId: input.departmentId,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "create",
    resourceType: "MarketingCampaign",
    resourceId: row.id,
    payload: { name: row.name, platform: row.platform },
  });

  return toDto(row);
}

export async function updateCampaign(
  id: string,
  input: z.infer<typeof updateCampaignSchema>,
  user: User
): Promise<DbMarketingCampaign> {
  const existing = await prisma.marketingCampaign.findUniqueOrThrow({
    where: { id },
  });
  ensureDepartmentAccess(user, existing.departmentId);
  ensureManagerRole(user);

  const row = await prisma.marketingCampaign.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.platform && { platform: input.platform }),
      ...(input.budget !== undefined && { budget: input.budget }),
      ...(input.startDate && { startDate: new Date(input.startDate) }),
      ...(input.endDate && { endDate: new Date(input.endDate) }),
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "update",
    resourceType: "MarketingCampaign",
    resourceId: id,
    payload: input as Record<string, unknown>,
  });

  return toDto(row);
}
