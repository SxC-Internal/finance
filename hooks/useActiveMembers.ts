import { useMemo } from "react";
import type { TeamMember, User } from "@/types";
import {
  getDepartmentDisplayName,
  getVisibleMembers,
  splitMembersByLeadership,
} from "@/lib/members";

export function useActiveMembers(user: User, members: TeamMember[]) {
  return useMemo(() => {
    const visibleMembers = getVisibleMembers(user, members);
    const { chiefs, team } = splitMembersByLeadership(visibleMembers);
    const deptName = getDepartmentDisplayName(user);

    return {
      visibleMembers,
      chiefs,
      team,
      deptName,
    };
  }, [user, members]);
}
