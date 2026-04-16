import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUserFromCredentials } from "@/lib/auth";
import { createSessionToken, getSessionCookieName } from "@/lib/server/session";

const loginSchema = z.object({
    email: z.string().trim().email(),
    password: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, data: null, error: "Invalid login payload" },
                { status: 422 }
            );
        }

        const { user, error } = createUserFromCredentials(parsed.data.email, parsed.data.password);
        if (!user || error) {
            return NextResponse.json(
                { success: false, data: null, error: error ?? "Invalid credentials" },
                { status: 401 }
            );
        }

        const token = createSessionToken(user.id);
        const response = NextResponse.json({ success: true, data: { user }, error: null });
        response.cookies.set({
            name: getSessionCookieName(),
            value: token,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 8,
        });

        return response;
    } catch {
        return NextResponse.json(
            { success: false, data: null, error: "Login failed" },
            { status: 500 }
        );
    }
}
