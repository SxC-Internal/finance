import { NextRequest } from "next/server";
import { auth } from "@/lib/auth-server";
import { createUserFromSession } from "@/lib/server/auth-helper";
import {
  getCampaigns,
  createCampaign,
  createCampaignSchema,
} from "@/lib/server/marketing-service";
import {
  apiSuccess,
  apiError,
  mapServiceErrorToStatus,
  getPublicErrorMessage,
} from "@/lib/server/http";
import { checkRateLimit, getRateLimitKey } from "@/lib/server/rate-limit";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return apiError("Unauthorized", 401);

  try {
    const user = createUserFromSession(session.user);
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId") ?? undefined;
    const campaigns = await getCampaigns(departmentId, user);
    return apiSuccess(campaigns);
  } catch (error) {
    const status = mapServiceErrorToStatus(error);
    return apiError(
      getPublicErrorMessage(error, status, "Failed to fetch campaigns"),
      status
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return apiError("Unauthorized", 401);

  const rl = checkRateLimit(
    getRateLimitKey(request, session.user.id),
    30,
    60_000
  );
  if (!rl.allowed) return apiError("Too many requests", 429);

  try {
    const user = createUserFromSession(session.user);
    const body = await request.json();
    const input = createCampaignSchema.parse(body);
    const campaign = await createCampaign(input, user);
    return apiSuccess(campaign, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError(error.message, 400);
    const status = mapServiceErrorToStatus(error);
    return apiError(
      getPublicErrorMessage(error, status, "Failed to create campaign"),
      status
    );
  }
}
