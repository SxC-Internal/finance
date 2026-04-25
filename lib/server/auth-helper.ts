import type { User, MembershipRole, UserRole } from "@/types";
import { DB_DEPARTMENTS, DB_USER_DEPARTMENTS } from "@/constants";

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
