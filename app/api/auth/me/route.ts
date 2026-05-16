import { getRequestUser, RequestAuthError } from "@/lib/server/request-user";
import { apiError, apiSuccess } from "@/lib/server/http";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth-server";
import { headers } from "next/headers";
import { z } from "zod";

export async function GET() {
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

const patchSchema = z.object({
    displayName: z.string().trim().min(1).max(60).nullable(),
});

export async function PATCH(request: Request) {
    try {
        const user = await getRequestUser();
        const body = await request.json();
        const { displayName } = patchSchema.parse(body);

        const session = await auth.api.getSession({ headers: await headers() });
        const sessionEmail = session?.user?.email;
        if (!sessionEmail) {
            return apiError("No active session to update", 400);
        }

        const updated = await prisma.user.update({
            where: { email: sessionEmail },
            data: { name: displayName ?? undefined },
        });

        return apiSuccess({ ...user, name: updated.name });
    } catch (error) {
        if (error instanceof RequestAuthError) {
            return apiError(error.message, error.statusCode);
        }
        if (error instanceof z.ZodError) {
            return apiError(error.issues[0]?.message ?? "Invalid input", 400);
        }
        return apiError("Unexpected error", 500);
    }
}
