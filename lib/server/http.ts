import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200, warning?: string) {
    const body: { success: true; data: T; error: null; warning?: string } = {
        success: true,
        data,
        error: null,
    };
    if (warning) body.warning = warning;
    return NextResponse.json(body, { status });
}

export function apiError(message: string, status = 400) {
    return NextResponse.json({ success: false, data: null, error: message }, { status });
}

export function mapServiceErrorToStatus(error: unknown): number {
    if (!(error instanceof Error)) return 500;

    const message = error.message.toLowerCase();
    if (message.includes("missing user") || message.includes("invalid user")) return 401;
    if (message.includes("forbidden") || message.includes("manager role")) return 403;
    if (message.includes("not found")) return 404;
    if (message.includes("invalid transition")) return 409;
    if (message.includes("payload too large")) return 413;
    if (message.includes("unsupported media type")) return 415;
    if (message.includes("validation")) return 422;

    return 500;
}

export function getPublicErrorMessage(
    error: unknown,
    status: number,
    fallback: string
): string {
    if (status >= 500) {
        return fallback;
    }

    return error instanceof Error ? error.message : fallback;
}
