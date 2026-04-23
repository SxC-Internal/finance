import { NextRequest } from "next/server";
import {
    updateDraftSchema,
    updateEmailBlastDraft,
} from "@/lib/server/email-blast-service";
import {
    apiError,
    apiSuccess,
    getPublicErrorMessage,
    mapServiceErrorToStatus,
} from "@/lib/server/http";
import { getRequestUser, RequestAuthError } from "@/lib/server/request-user";

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ blastId: string }> }
) {
    try {
        const user = await getRequestUser();
        const { blastId } = await context.params;
        const body = await request.json();

        const parsed = updateDraftSchema.safeParse({
            blastId,
            ...body,
        });

        if (!parsed.success) {
            return apiError(parsed.error.issues.map((issue) => issue.message).join("; "), 422);
        }

        const updated = await updateEmailBlastDraft(parsed.data, user);
        return apiSuccess(updated);
    } catch (error) {
        if (error instanceof RequestAuthError) {
            return apiError(error.message, error.statusCode);
        }

        const status = mapServiceErrorToStatus(error);
        return apiError(
            getPublicErrorMessage(error, status, "Failed to update draft"),
            status
        );
    }
}
