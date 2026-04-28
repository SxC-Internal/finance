"use client";

import React from "react";
import { Menu } from "lucide-react";
import type { User } from "@/types";

interface HeaderProps {
  currentUser: User;
  openMobileMenu: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, openMobileMenu }) => {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 sticky top-0 transition-colors duration-300">
      <div className="flex items-center md:hidden">
        <button
          onClick={openMobileMenu}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center space-x-6">
        <div className="px-3 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center transition-colors duration-300">
          {currentUser.name}
        </div>
      </div>
    </header>
  );
};

export default Header;
