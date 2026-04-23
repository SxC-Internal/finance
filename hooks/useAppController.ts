import { useCallback, useEffect } from "react";
import type { User } from "@/types";
import { View } from "@/types";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useAuthState } from "@/hooks/useAuthState";
import { useThemeState } from "@/hooks/useTheme";

export function useAppController() {
  const auth = useAuthState();
  const theme = useThemeState("dark");

  // Determine initial view based on user role
  const getInitialView = (user?: User | null): View => {
    if (!user) return View.FINANCE_DASHBOARD;
    if (user.role === 'finance' || user.role === 'admin') return View.FINANCE_DASHBOARD;
    return View.SETTINGS;
  };

  const initialView = getInitialView(auth.currentUser);
  const nav = useAppNavigation(initialView);
  const { navigate } = nav;

  useEffect(() => {
    navigate(getInitialView(auth.currentUser));
  }, [auth.currentUser, navigate]);

  const handleLogout = useCallback(async () => {
    await auth.logout();
    navigate(View.FINANCE_DASHBOARD);
  }, [auth, navigate]);

  return {
    ...auth,
    ...nav,
    ...theme,
    handleLogout,
  };
}
