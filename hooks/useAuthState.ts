import { useCallback, useEffect, useState } from "react";
import type { User } from "@/types";

export function useAuthState() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) return;
        const payload = (await res.json()) as { success: boolean; data: User | null };
        if (payload.success && payload.data) {
          setCurrentUser(payload.data);
        }
      })
      .catch(() => {
        // Not logged in or network error — stay unauthenticated
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, []);

  const login = useCallback((user: User) => {
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    void fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
  }, []);

  return {
    currentUser,
    isHydrating,
    login,
    logout,
  };
}
