import { NextRequest } from "next/server";
import { auth } from "@/lib/auth-server";
import { createUserFromSession } from "@/lib/server/auth-helper";
import {
  approveReport,
  revokeReport,
} from "@/lib/server/analytics-service";
import {
  apiSuccess,
  apiError,
  mapServiceErrorToStatus,
  getPublicErrorMessage,
} from "@/lib/server/http";
import { checkRateLimit, getRateLimitKey } from "@/lib/server/rate-limit";
import { z } from "zod";

const patchSchema = z.object({
  revoke: z.boolean().optional().default(false),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return apiError("Unauthorized", 401);

  const rl = checkRateLimit(
    getRateLimitKey(request, session.user.id),
    30,
    60_000
  );
  if (!rl.allowed) return apiError("Too many requests", 429);

  try {
    const { id } = await params;
    const user = createUserFromSession(session.user);

    const body = await request.json().catch(() => ({}));
    const { revoke } = patchSchema.parse(body);

    const report = revoke
      ? await revokeReport(id, user)
      : await approveReport(id, user);

    return apiSuccess(report);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError(error.message, 400);
    const status = mapServiceErrorToStatus(error);
    return apiError(
      getPublicErrorMessage(error, status, "Failed to update report status"),
      status
    );
  }
}
