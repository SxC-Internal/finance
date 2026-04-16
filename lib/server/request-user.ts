import { DB_DEPARTMENTS, DB_USERS, DB_USER_DEPARTMENTS } from "@/constants";
import type { User, UserRole } from "@/types";
import {
    extractSessionTokenFromCookieHeader,
    verifySessionToken,
} from "@/lib/server/session";

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

export function getRequestUser(request: Request): User {
    const token = extractSessionTokenFromCookieHeader(request.headers.get("cookie"));
    const canUseInsecureDevAuth =
        process.env.NODE_ENV !== "production" ||
        process.env.ALLOW_INSECURE_DEV_AUTH === "true";

    let userId: string | null = null;

    if (token) {
        const session = verifySessionToken(token);
        if (session) {
            userId = session.uid;
        }
    }

    if (!userId && canUseInsecureDevAuth) {
        userId = request.headers.get("x-user-id");
    }

    if (!userId) {
        throw new RequestAuthError("Missing authentication context", 401);
    }

    const dbUser = DB_USERS.find((user) => user.id === userId && user.isActive);
    if (!dbUser) {
        throw new RequestAuthError("Invalid user context", 401);
    }

    const membership = DB_USER_DEPARTMENTS.find((item) => item.userId === dbUser.id);
    const department = membership
        ? DB_DEPARTMENTS.find((dep) => dep.id === membership.departmentId)
        : undefined;

    if (dbUser.id !== "u_admin" && (!membership || !department)) {
        throw new RequestAuthError("Forbidden: user is not mapped to a department", 403);
    }

    const role: UserRole = dbUser.id === "u_admin" ? "admin" : (department?.slug as UserRole);

    return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role,
        departmentId: mapRoleToDepartmentId(role, department?.slug),
        membershipRole: membership?.role,
    };
}
