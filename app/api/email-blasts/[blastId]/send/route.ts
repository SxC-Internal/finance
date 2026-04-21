import { NextRequest } from "next/server";
import { blastIdSchema, getSendPayload, sendEmailBlast } from "@/lib/server/email-blast-service";
import { sendBlastEmail } from "@/lib/server/email-provider";
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
        const parsed = blastIdSchema.safeParse({ blastId });

        if (!parsed.success) {
            return apiError(parsed.error.issues.map((issue) => issue.message).join("; "), 422);
        }

        const payload = await getSendPayload(parsed.data.blastId, user);

        const isDevNoProvider =
            process.env.NODE_ENV === "development" &&
            !process.env.RESEND_API_KEY &&
            !process.env.SMTP_HOST;

        if (!isDevNoProvider) {
            try {
                await sendBlastEmail({
                    subject: payload.subject,
                    body: payload.body,
                    contentMode: payload.contentMode,
                    recipients: payload.recipients,
                    senderName: payload.senderName,
                    senderEmail: payload.senderEmail,
                    replyToEmail: payload.replyToEmail,
                });
            } catch (emailError) {
                if (process.env.NODE_ENV !== "development") {
                    throw emailError;
                }
                console.warn(
                    "[email-blast] Email delivery failed in dev mode (marking as sent anyway):",
                    emailError instanceof Error ? emailError.message : emailError
                );
            }
        }

        const updated = await sendEmailBlast(parsed.data.blastId, user);
        return apiSuccess(updated);
    } catch (error) {
        if (error instanceof RequestAuthError) {
            return apiError(error.message, error.statusCode);
        }

        const status = mapServiceErrorToStatus(error);
        return apiError(
            getPublicErrorMessage(error, status, "Failed to send email blast"),
            status
        );
    }
}
