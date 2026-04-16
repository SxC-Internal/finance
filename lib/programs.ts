import type { ProgramStatus } from "@/types";

export function getProgramStatusClass(status: ProgramStatus | string): string {
  switch (status) {
    case "Active":
      return "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
    case "Upcoming":
      return "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    case "Completed":
      return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600";
    default:
      return "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white";
  }
}
