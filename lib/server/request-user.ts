import { DB_DEPARTMENTS, DB_USERS, DB_USER_DEPARTMENTS } from "@/constants";
import type { User, UserRole } from "@/types";
import { auth } from "@/lib/auth-server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";

export class RequestAuthError extends Error {
    readonly statusCode: number;

    constructor(message: string, statusCode = 401) {
        super(message);
        this.statusCode = statusCode;
    }
}

function mapRoleToDepartmentId(role?: UserRole, departmentId?: string): string | undefined {
    if (departmentId) {
        return departmentId.startsWith("d_") ? departmentId : `d_${departmentId}`;
    }

    if (!role || role === "admin") return undefined;
    return `d_${role}`;
}

export async function getRequestUser(): Promise<User> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    let email: string | null = session?.user?.email ?? null;

    const canUseInsecureDevAuth =
        process.env.NODE_ENV !== "production" ||
        process.env.ALLOW_INSECURE_DEV_AUTH === "true";

    if (!email && canUseInsecureDevAuth) {
        // Fallback to x-user-id for dev/testing if no session
        const h = await headers();
        const userId = h.get("x-user-id");
        if (userId) {
            const devUser = DB_USERS.find(u => u.id === userId);
            email = devUser?.email ?? null;
        }
    }

    if (!email) {
        throw new RequestAuthError("Missing authentication context", 401);
    }

    // Keep the actual session email for Prisma lookup (the real Google account)
    const sessionEmail = email;

    let dbUser = DB_USERS.find((user) => user.email.toLowerCase() === email?.toLowerCase() && user.isActive);

    // Fallback for x-user-id based dev auth (dummy login, no real Google session)
    if (!dbUser && canUseInsecureDevAuth && !session?.user?.email) {
        dbUser = DB_USERS.find(u => u.id === "u_admin");
    }

    // Any user authenticated via Google OAuth (better-auth) who isn't in DB_USERS
    // gets default finance member access — this is a shared internal finance tool.
    if (!dbUser && session?.user?.email) {
        const prismaUser = await prisma.user.findUnique({ where: { email: sessionEmail! } }).catch(() => null);
        return {
            id: session.user.id,
            name: prismaUser?.displayName ?? prismaUser?.name ?? session.user.name ?? sessionEmail,
            email: session.user.email,
            role: "finance" as UserRole,
            departmentId: "d_finance",
            membershipRole: "member",
            level: undefined,
        };
    }

    if (!dbUser) {
        throw new RequestAuthError("User not authorized. Please contact an administrator.", 403);
    }

    const membership = DB_USER_DEPARTMENTS.find((item) => item.userId === dbUser.id);
    const department = membership
        ? DB_DEPARTMENTS.find((dep) => dep.id === membership.departmentId)
        : undefined;

    if (dbUser.id !== "u_admin" && (!membership || !department)) {
        throw new RequestAuthError("Forbidden: user is not mapped to a department", 403);
    }

    const role: UserRole = dbUser.id === "u_admin" ? "admin" : (department?.slug as UserRole);

    const prismaUser = await prisma.user.findUnique({ where: { email: sessionEmail! } }).catch(() => null);
    const resolvedName = prismaUser?.displayName ?? prismaUser?.name ?? dbUser.name;

    return {
        id: dbUser.id,
        name: resolvedName,
        email: dbUser.email,
        role,
        departmentId: mapRoleToDepartmentId(role, department?.slug),
        membershipRole: membership?.role,
        level: membership?.level,
    };
}

