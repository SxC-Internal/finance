"use client";

import React from "react";
import { Menu, Sun, Moon } from "lucide-react";
import type { User } from "@/types";
import { View, type Theme } from "@/types";

const VIEW_LABELS: Record<View, string> = {
  [View.DASHBOARD]: "Dashboard",
  [View.DATA_REVIEW]: "Data Review",
  [View.PROGRAMS]: "Programs",
  [View.MEMBERS]: "Members",
  [View.SETTINGS]: "Settings",
  [View.FINANCE_DASHBOARD]: "Finance Dashboard",
  [View.FINANCE_CAPITAL]: "Capital Management",
  [View.FINANCE_EMAIL_BLAST]: "Email Blast",
};

interface HeaderProps {
  currentUser: User;
  activeView: View;
  theme: Theme;
  openMobileMenu: () => void;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeView,
  theme,
  openMobileMenu,
  onToggleTheme,
}) => {
  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 sticky top-0 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <button
          onClick={openMobileMenu}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-tight">
          {VIEW_LABELS[activeView]}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-700">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 select-none">
            {initials}
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[140px] truncate">
            {currentUser.name}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
