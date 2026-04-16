import type {
  DbDepartment,
  DbUser,
  DbUserDepartment,
  TeamMember,
  User,
} from "@/types";

function buildAvatarUrl(name: string): string {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&background=random&color=fff`;
}

function toUpperFirst(input: string): string {
  return input.length === 0 ? input : input.charAt(0).toUpperCase() + input.slice(1);
}

function roleTitleFromMembership(params: {
  departmentSlug: string;
  membershipRole: string;
}): string {
  const { departmentSlug, membershipRole } = params;

  if (membershipRole === "head") {
    switch (departmentSlug) {
      case "finance":
        return "Chief Financial Officer";
      case "hr":
        return "Chief People Officer";
      case "marketing":
        return "Chief Marketing Officer";
      case "tech":
        return "Chief Technology Officer";
      case "ops":
        return "Chief Operating Officer";
      default:
        return `Chief ${toUpperFirst(departmentSlug)} Officer`;
    }
  }

  if (membershipRole === "manager") {
    return `${toUpperFirst(departmentSlug)} Manager`;
  }

  return `${toUpperFirst(departmentSlug)} Member`;
}

export function buildTeamMembersFromDb(params: {
  users: DbUser[];
  userDepartments: DbUserDepartment[];
  departments: DbDepartment[];
}): TeamMember[] {
  const { users, userDepartments, departments } = params;

  const deptById = departments.reduce<Record<string, DbDepartment>>((acc, d) => {
    acc[d.id] = d;
    return acc;
  }, {});

  const userById = users.reduce<Record<string, DbUser>>((acc, u) => {
    acc[u.id] = u;
    return acc;
  }, {});

  return userDepartments
    .map((ud) => {
      const u = userById[ud.userId];
      const d = deptById[ud.departmentId];
      if (!u || !d) return null;

      const member: TeamMember = {
        id: ud.id,
        name: u.name,
        role: roleTitleFromMembership({
          departmentSlug: d.slug,
          membershipRole: ud.role,
        }),
        departmentId: d.slug,
        image: buildAvatarUrl(u.name),
        email: u.email,
      };

      return member;
    })
    .filter((m): m is TeamMember => m !== null);
}

export function getVisibleMembers(user: User, members: TeamMember[]): TeamMember[] {
  return user.role === "admin"
    ? members
    : members.filter((m) => m.departmentId === user.departmentId);
}

export function splitMembersByLeadership(members: TeamMember[]): {
  chiefs: TeamMember[];
  team: TeamMember[];
} {
  return {
    chiefs: members.filter((m) => m.role.startsWith("Chief")),
    team: members.filter((m) => !m.role.startsWith("Chief")),
  };
}

export function getDepartmentDisplayName(user: User): string {
  return user.departmentId
    ? toUpperFirst(user.departmentId)
    : "Global";
}

export function getDepartmentBadgeClass(departmentId: string): string {
  switch (departmentId) {
    case "finance":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300";
    case "ops":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "marketing":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
    case "hr":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300";
    case "tech":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
    default:
      return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
  }
}

export function getDepartmentDotClass(departmentId: string): string {
  switch (departmentId) {
    case "finance":
      return "bg-emerald-500";
    case "ops":
      return "bg-blue-500";
    case "marketing":
      return "bg-amber-500";
    case "hr":
      return "bg-indigo-500";
    case "tech":
      return "bg-purple-500";
    default:
      return "bg-purple-500";
  }
}
