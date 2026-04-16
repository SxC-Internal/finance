import type { MembershipRole, User, UserRole } from "@/types";
import {
  DB_DEPARTMENTS,
  DB_USER_DEPARTMENTS,
  DB_USERS,
} from "@/constants";

function buildAvatarUrl(name: string): string {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&background=random&color=fff`;
}

function resolveUserRoleFromDb(userId: string): {
  role: UserRole;
  departmentId?: string;
  membershipRole?: MembershipRole;
} {
  // Admin is a special-case in this demo
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
    role: dept.slug,
    departmentId: dept.id,
    membershipRole: membership.role,
  };
}

export function createUserFromCredentials(email: string, password: string): {
  user?: User;
  error?: string;
} {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();

  if (trimmedEmail.length === 0) {
    return { error: "Email is required." };
  }

  if (trimmedPassword.length === 0) {
    return { error: "Password is required." };
  }

  const dbUser = DB_USERS.find((u) => u.email.toLowerCase() === trimmedEmail);
  if (!dbUser) {
    return {
      error:
        "User not found (dummy DB). Try finance.lead@sxc.ac.id / password or admin@sxc.ac.id / admin.",
    };
  }

  if (!dbUser.isActive) {
    return { error: "User is inactive." };
  }

  if (dbUser.password !== trimmedPassword) {
    return { error: "Invalid email or password." };
  }

  const resolved = resolveUserRoleFromDb(dbUser.id);

  const user: User = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: resolved.role,
    departmentId: resolved.departmentId,
    membershipRole: resolved.membershipRole,
    avatar: buildAvatarUrl(dbUser.name),
  };

  return { user };
}
