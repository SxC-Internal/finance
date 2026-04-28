import type { User, MembershipRole, UserRole } from "@/types";
import { DB_DEPARTMENTS, DB_USER_DEPARTMENTS } from "@/constants";

export function ensureDepartmentAccess(user: User, departmentId: string): void {
  if (user.role === "admin") return;
  const userDeptId = user.departmentId ?? `d_${user.role}`;
  if (userDeptId !== departmentId) {
    throw new Error("Forbidden: cross-department access is not allowed");
  }
}

export function ensureManagerRole(user: User): void {
  if (user.role === "admin") return;
  if (user.membershipRole !== "manager" && user.membershipRole !== "head") {
    throw new Error("Forbidden: manager role required");
  }
}

function resolveUserRoleFromDb(userId: string): {
  role: UserRole;
  departmentId?: string;
  membershipRole?: MembershipRole;
} {
  if (userId === "u_admin") {
    return { role: "admin" };
  }

  const membership = DB_USER_DEPARTMENTS.find((ud) => ud.userId === userId);
  if (!membership) {
    return { role: "admin" };
  }

  const dept = DB_DEPARTMENTS.find((d) => d.id === membership.departmentId);
  if (!dept) {
    return { role: "admin" };
  }

  return {
    role: dept.slug as UserRole,
    departmentId: dept.id,
    membershipRole: membership.role,
  };
}

export function createUserFromSession(sessionUser: {
  id: string;
  email?: string | null;
  name?: string | null;
}): User {
  const resolved = resolveUserRoleFromDb(sessionUser.id);

  return {
    id: sessionUser.id,
    email: sessionUser.email || "",
    name: sessionUser.name || "",
    role: resolved.role,
    departmentId: resolved.departmentId,
    membershipRole: resolved.membershipRole,
  };
}
