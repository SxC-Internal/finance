import { useCallback, useEffect, useState } from "react";
import type { User } from "@/types";
import { useSession, signOut } from "@/lib/auth-client";

export function useAuthState() {
  const { data: session, isPending: isHydrating } = useSession();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (session?.user) {
      // Fetch role mapping from server or use a client-side helper
      fetch("/api/auth/me")
        .then(async (res) => {
          if (!res.ok) return;
          const payload = (await res.json()) as { success: boolean; data: User | null };
          if (payload.success && payload.data) {
            setCurrentUser(payload.data);
          }
        })
        .catch(() => {
          // Not logged in or network error
        });
    } else {
      setCurrentUser(null);
    }
  }, [session]);

  const logout = useCallback(async () => {
    await signOut();
    setCurrentUser(null);
  }, []);

  return {
    currentUser,
    isHydrating,
    logout,
  };
}

