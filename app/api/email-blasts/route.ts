import { NextRequest } from "next/server";
import {
    createBlastSchema,
    createEmailBlast,
    isFallbackActive,
    listEmailBlasts,
} from "@/lib/server/email-blast-service";
import {
    apiError,
    apiSuccess,
    getPublicErrorMessage,
    mapServiceErrorToStatus,
} from "@/lib/server/http";
import { getRequestUser, RequestAuthError } from "@/lib/server/request-user";

export async function GET(request: NextRequest) {
    try {
        const user = getRequestUser(request);
        const { searchParams } = new URL(request.url);
        const departmentId = searchParams.get("departmentId") ?? user.departmentId ?? "d_finance";
        const data = await listEmailBlasts(departmentId, user);
        const warning = isFallbackActive()
            ? "Database unavailable — changes are in-memory only and will be lost on restart"
            : undefined;
        return apiSuccess(data, 200, warning);
    } catch (error) {
        if (error instanceof RequestAuthError) {
            return apiError(error.message, error.statusCode);
        }

        const status = mapServiceErrorToStatus(error);
        return apiError(
            getPublicErrorMessage(error, status, "Failed to list email blasts"),
            status
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = getRequestUser(request);
        const body = await request.json();
        const parsed = createBlastSchema.safeParse(body);

        if (!parsed.success) {
            return apiError(parsed.error.issues.map((issue) => issue.message).join("; "), 422);
        }

        const blast = await createEmailBlast(parsed.data, user);
        return apiSuccess(blast, 201);
    } catch (error) {
        if (error instanceof RequestAuthError) {
            return apiError(error.message, error.statusCode);
        }

        const status = mapServiceErrorToStatus(error);
        return apiError(
            getPublicErrorMessage(error, status, "Failed to create email blast"),
            status
        );
    }
}
