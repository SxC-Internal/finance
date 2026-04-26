import { NextRequest } from "next/server";
import { getAuthorizedFromEmails } from "@/lib/server/email-provider";
import { apiError, apiSuccess } from "@/lib/server/http";
import { getRequestUser, RequestAuthError } from "@/lib/server/request-user";

export async function GET(_request: NextRequest) {
    try {
        await getRequestUser();
        const addresses = getAuthorizedFromEmails();
        return apiSuccess({ addresses });
    } catch (error) {
        if (error instanceof RequestAuthError) {
            return apiError(error.message, error.statusCode);
        }

        return apiError("Failed to load authorized sender addresses", 500);
    }
}
