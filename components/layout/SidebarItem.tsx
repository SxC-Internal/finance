"use client";

import React from "react";
import type { ComponentType } from "react";

interface SidebarItemProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  isActive,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 mb-2 rounded-lg transition-all duration-200 group ${
      isActive
        ? "bg-brand-500/10 text-brand-500 border-r-2 border-brand-500"
        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
    }`}
  >
    <Icon
      size={20}
      className={`mr-3 ${
        isActive
          ? "text-brand-500"
          : "text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
      }`}
    />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

export default SidebarItem;
