import { useCallback } from "react";
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
    if (!user) return View.DASHBOARD;
    if (user.role === 'finance') return View.FINANCE_DASHBOARD;
    return View.DASHBOARD;
  };

  const initialView = getInitialView(auth.currentUser);
  const nav = useAppNavigation(initialView);

  const handleLogin = useCallback(
    (user: User) => {
      auth.login(user);
      // Navigate to role-specific dashboard
      const defaultView = user.role === 'finance' ? View.FINANCE_DASHBOARD : View.DASHBOARD;
      nav.navigate(defaultView);
    },
    [auth, nav],
  );

  const handleLogout = useCallback(() => {
    auth.logout();
    nav.navigate(View.DASHBOARD);
  }, [auth, nav]);

  return {
    ...auth,
    ...nav,
    ...theme,
    handleLogin,
    handleLogout,
  };
}
