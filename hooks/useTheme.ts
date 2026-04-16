import { useCallback, useState } from "react";
import type { Theme } from "@/types";

export function useThemeState(initialTheme: Theme = "dark") {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}
