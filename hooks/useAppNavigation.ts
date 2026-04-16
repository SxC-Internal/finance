import { useCallback, useState } from "react";
import { View } from "@/types";

export function useAppNavigation(initialView: View = View.DASHBOARD) {
  const [activeView, setActiveView] = useState<View>(initialView);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const navigate = useCallback((view: View) => {
    setActiveView(view);
  }, []);

  const navigateFromMobile = useCallback((view: View) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  }, []);

  return {
    activeView,
    setActiveView,
    isMobileMenuOpen,
    openMobileMenu,
    closeMobileMenu,
    navigate,
    navigateFromMobile,
  };
}
