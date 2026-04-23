import { NextRequest } from "next/server";
import {
    addBlastAttachment,
    blastIdSchema,
    listBlastAttachments,
} from "@/lib/server/email-blast-service";
import {
    apiError,
    apiSuccess,
    getPublicErrorMessage,
    mapServiceErrorToStatus,
} from "@/lib/server/http";
import { getRequestUser, RequestAuthError } from "@/lib/server/request-user";

export async function GET(
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

        const attachments = await listBlastAttachments(parsed.data.blastId, user);
        return apiSuccess({ attachments });
    } catch (error) {
        if (error instanceof RequestAuthError) {
            return apiError(error.message, error.statusCode);
        }

        const status = mapServiceErrorToStatus(error);
        return apiError(
            getPublicErrorMessage(error, status, "Failed to list attachments"),
            status
        );
    }
}

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

        const form = await request.formData();
        const file = form.get("file");

        if (!(file instanceof File)) {
            return apiError("Validation failed: file is required", 422);
        }

        const data = Buffer.from(await file.arrayBuffer());

        const attachment = await addBlastAttachment(
            parsed.data.blastId,
            {
                filename: file.name,
                mimeType: file.type || "application/octet-stream",
                data,
                uploadedBy: user.id,
                publicBaseUrl: request.nextUrl.origin,
            },
            user
        );

        return apiSuccess({ attachment }, 201);
    } catch (error) {
        if (error instanceof RequestAuthError) {
            return apiError(error.message, error.statusCode);
        }

        const status = mapServiceErrorToStatus(error);
        return apiError(
            getPublicErrorMessage(error, status, "Failed to upload attachment"),
            status
        );
    }
}
