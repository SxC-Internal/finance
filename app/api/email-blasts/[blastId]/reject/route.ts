import { NextRequest } from "next/server";
import { rejectEmailBlast, rejectSchema } from "@/lib/server/email-blast-service";
import {
    apiError,
    apiSuccess,
    getPublicErrorMessage,
    mapServiceErrorToStatus,
} from "@/lib/server/http";
import { getRequestUser, RequestAuthError } from "@/lib/server/request-user";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ blastId: string }> }
) {
    try {
        const user = getRequestUser(request);
        const { blastId } = await context.params;
        const body = await request.json();

        const parsed = rejectSchema.safeParse({
            blastId,
            reason: body?.reason,
        });

        if (!parsed.success) {
            return apiError(parsed.error.issues.map((issue) => issue.message).join("; "), 422);
        }

        const blast = await rejectEmailBlast(parsed.data.blastId, parsed.data.reason, user);
        return apiSuccess(blast);
    } catch (error) {
        if (error instanceof RequestAuthError) {
            return apiError(error.message, error.statusCode);
        }

        const status = mapServiceErrorToStatus(error);
        return apiError(
            getPublicErrorMessage(error, status, "Failed to reject email blast"),
            status
        );
    }
}
