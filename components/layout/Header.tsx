"use client";

import React from "react";
import { Bell, Menu } from "lucide-react";
import type { User } from "@/types";

interface HeaderProps {
  currentUser: User;
  openMobileMenu: () => void;
  onOpenReportModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, openMobileMenu, onOpenReportModal }) => {
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
        <button className="relative text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
        <div className="px-3 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center transition-colors duration-300">
          {currentUser.name}
        </div>
        <button
          onClick={onOpenReportModal}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
        >
          Create Report
        </button>
      </div>
    </header>
  );
};

export default Header;