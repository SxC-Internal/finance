import { NextRequest } from "next/server";
import { blastIdSchema, submitEmailBlast } from "@/lib/server/email-blast-service";
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
        const user = await getRequestUser();
        const { blastId } = await context.params;
        const parsed = blastIdSchema.safeParse({ blastId });

        if (!parsed.success) {
            return apiError(parsed.error.issues.map((issue) => issue.message).join("; "), 422);
        }

        const blast = await submitEmailBlast(parsed.data.blastId, user);
        return apiSuccess(blast);
    } catch (error) {
        if (error instanceof RequestAuthError) {
            return apiError(error.message, error.statusCode);
        }

        const status = mapServiceErrorToStatus(error);
        return apiError(
            getPublicErrorMessage(error, status, "Failed to submit email blast"),
            status
        );
    }
}
