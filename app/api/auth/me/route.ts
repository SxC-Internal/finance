import { NextRequest } from "next/server";
import { getRequestUser, RequestAuthError } from "@/lib/server/request-user";
import { apiError, apiSuccess } from "@/lib/server/http";

export async function GET(request: NextRequest) {
    try {
        const user = await getRequestUser();
        return apiSuccess(user);
    } catch (error) {

        if (error instanceof RequestAuthError) {
            return apiError(error.message, error.statusCode);
        }
        return apiError("Unexpected error", 500);
    }
}
