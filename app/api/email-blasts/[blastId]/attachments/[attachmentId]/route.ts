import { NextRequest } from "next/server";
import { blastIdSchema, deleteBlastAttachment } from "@/lib/server/email-blast-service";
import {
    apiError,
    apiSuccess,
    getPublicErrorMessage,
    mapServiceErrorToStatus,
} from "@/lib/server/http";
import { getRequestUser, RequestAuthError } from "@/lib/server/request-user";
import { z } from "zod";

const deleteAttachmentSchema = z.object({
    blastId: z.string().trim().min(1),
    attachmentId: z.string().trim().min(1),
});

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ blastId: string; attachmentId: string }> }
) {
    try {
        const user = await getRequestUser();
        const { blastId, attachmentId } = await context.params;

        const parsedBlast = blastIdSchema.safeParse({ blastId });
        if (!parsedBlast.success) {
            return apiError(parsedBlast.error.issues.map((issue) => issue.message).join("; "), 422);
        }

        const parsed = deleteAttachmentSchema.safeParse({
            blastId: parsedBlast.data.blastId,
            attachmentId,
        });
        if (!parsed.success) {
            return apiError(parsed.error.issues.map((issue) => issue.message).join("; "), 422);
        }

        await deleteBlastAttachment(parsed.data.blastId, parsed.data.attachmentId, user);
        return apiSuccess({ deleted: true });
    } catch (error) {
        if (error instanceof RequestAuthError) {
            return apiError(error.message, error.statusCode);
        }

        const status = mapServiceErrorToStatus(error);
        return apiError(
            getPublicErrorMessage(error, status, "Failed to delete attachment"),
            status
        );
    }
}
