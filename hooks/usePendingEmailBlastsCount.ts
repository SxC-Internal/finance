import { useEffect, useMemo, useState } from "react";
import type { DbEmailBlast, User } from "@/types";
import { fetchEmailBlasts } from "@/lib/api/emailBlasts";

export function usePendingEmailBlastsCount(user: User) {
  const [blasts, setBlasts] = useState<DbEmailBlast[]>([]);
  const deptId = user.departmentId ?? "d_finance";

  useEffect(() => {
    fetchEmailBlasts(user, deptId)
      .then((payload) => setBlasts(payload.blasts))
      .catch(() => setBlasts([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptId]);

  const pendingCount = useMemo(
    () => blasts.filter((b) => b.status === "pending_approval").length,
    [blasts]
  );

  return { blasts, pendingCount };
}
