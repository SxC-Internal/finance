import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "sxc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

interface SessionPayload {
    uid: string;
    exp: number;
}

function getSessionSecret(): string {
    const secret = process.env.SXC_SESSION_SECRET;
    if (!secret) {
        throw new Error("SXC_SESSION_SECRET is not configured");
    }

    return secret;
}

function base64UrlEncode(input: string): string {
    return Buffer.from(input)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

function base64UrlDecode(input: string): string {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function sign(data: string, secret: string): string {
    return createHmac("sha256", secret).update(data).digest("base64url");
}

export function getSessionCookieName(): string {
    return SESSION_COOKIE;
}

export function createSessionToken(userId: string): string {
    const payload: SessionPayload = {
        uid: userId,
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    };

    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = sign(encodedPayload, getSessionSecret());
    return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
    const [payloadPart, signaturePart] = token.split(".");
    if (!payloadPart || !signaturePart) return null;

    const expectedSig = sign(payloadPart, getSessionSecret());
    const actualSig = Buffer.from(signaturePart);
    const expectedSigBuffer = Buffer.from(expectedSig);

    if (actualSig.length !== expectedSigBuffer.length) return null;
    if (!timingSafeEqual(actualSig, expectedSigBuffer)) return null;

    try {
        const payload = JSON.parse(base64UrlDecode(payloadPart)) as SessionPayload;
        if (!payload.uid || !payload.exp) return null;
        if (payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch {
        return null;
    }
}

export function extractSessionTokenFromCookieHeader(cookieHeader: string | null): string | null {
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(";").map((pair) => pair.trim());
    const sessionCookie = cookies.find((pair) => pair.startsWith(`${SESSION_COOKIE}=`));
    if (!sessionCookie) return null;

    return sessionCookie.slice(`${SESSION_COOKIE}=`.length);
}
