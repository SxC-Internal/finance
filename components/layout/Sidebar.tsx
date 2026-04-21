"use client";

import React from "react";
import {
  Settings,
  X,
  LogOut,
  DollarSign,
  Mail,
  TrendingUp,
} from "lucide-react";
import { View } from "@/types";
import type { User } from "@/types";
import SidebarItem from "./SidebarItem";

interface SidebarProps {
  currentUser: User;
  activeView: View;
  navigate: (view: View) => void;
  navigateFromMobile: (view: View) => void;
  handleLogout: () => void;
  isMobileMenuOpen: boolean;
  closeMobileMenu: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeView,
  navigate,
  navigateFromMobile,
  handleLogout,
  isMobileMenuOpen,
  closeMobileMenu,
}) => {
  return (
    <>
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors duration-300 relative z-20">
        <div className="p-6">
          <div className="flex items-center space-x-2 text-blue-500 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Students<span className="text-blue-500">x</span>CEOs
            </span>
          </div>

          <nav className="flex-1 space-y-1">
            {(currentUser.role === 'finance' || currentUser.role === 'admin') && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 pt-4 pb-1">
                  Finance
                </p>
                <SidebarItem icon={TrendingUp} label="Finance Dashboard" isActive={activeView === View.FINANCE_DASHBOARD} onClick={() => navigate(View.FINANCE_DASHBOARD)} />
                <SidebarItem icon={DollarSign} label="Capital Management" isActive={activeView === View.FINANCE_CAPITAL} onClick={() => navigate(View.FINANCE_CAPITAL)} />
                <SidebarItem icon={Mail} label="Email Blast" isActive={activeView === View.FINANCE_EMAIL_BLAST} onClick={() => navigate(View.FINANCE_EMAIL_BLAST)} />
              </>
            )}
            <SidebarItem icon={Settings} label="Settings" isActive={activeView === View.SETTINGS} onClick={() => navigate(View.SETTINGS)} />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3 mb-4">
            <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-600" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{currentUser.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center text-xs text-slate-500 hover:text-rose-500 transition-colors w-full">
            <LogOut size={14} className="mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeMobileMenu}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-in slide-in-from-left duration-300">
            <button onClick={closeMobileMenu} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>

            <div className="flex items-center space-x-2 text-blue-500 mb-8 mt-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Students<span className="text-blue-500">x</span>CEOs
              </span>
            </div>

            <nav className="flex-1 space-y-2">
              {(currentUser.role === 'finance' || currentUser.role === 'admin') && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 pt-4 pb-1">
                    Finance
                  </p>
                  <SidebarItem icon={TrendingUp} label="Finance Dashboard" isActive={activeView === View.FINANCE_DASHBOARD} onClick={() => navigateFromMobile(View.FINANCE_DASHBOARD)} />
                  <SidebarItem icon={DollarSign} label="Capital Management" isActive={activeView === View.FINANCE_CAPITAL} onClick={() => navigateFromMobile(View.FINANCE_CAPITAL)} />
                  <SidebarItem icon={Mail} label="Email Blast" isActive={activeView === View.FINANCE_EMAIL_BLAST} onClick={() => navigateFromMobile(View.FINANCE_EMAIL_BLAST)} />
                </>
              )}
              <SidebarItem icon={Settings} label="Settings" isActive={activeView === View.SETTINGS} onClick={() => navigateFromMobile(View.SETTINGS)} />
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
                <button onClick={handleLogout} className="flex items-center text-slate-500 hover:text-rose-500 transition-colors w-full">
                  <LogOut size={18} className="mr-3" /> Sign Out
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;