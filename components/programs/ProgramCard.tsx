'use client'

import React from "react";
import { ChevronRight } from "lucide-react";
import type { Program } from "@/types";
import { getProgramStatusClass } from "@/lib/programs";

interface ProgramCardProps {
  program: Program;
  onClick?: () => void;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ program, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50 hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all cursor-pointer group flex flex-col h-full shadow-sm dark:shadow-none hover:shadow-md"
    >
      <div className="flex justify-between items-start mb-4">
        <span
          className={`text-xs px-2 py-1 rounded-md border font-medium ${getProgramStatusClass?.(program.status) || "bg-blue-100 text-blue-700 border-blue-200"}`}
        >
          {program.status}
        </span>
        <span className="text-slate-500 dark:text-slate-500 text-xs font-medium">
          {program.startDate}
        </span>
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">
        {program.title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 grow line-clamp-2">
        {program.description}
      </p>

      <div className="space-y-4">
        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>Batch</span>
          <span className="text-slate-900 dark:text-slate-200 font-medium">
            {program.batch}
          </span>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-600 dark:text-slate-400">Progress</span>
            <span className="text-brand-500 dark:text-brand-400 font-mono font-medium">
              {program.progress}%
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${program.progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-4">
          <div className="flex -space-x-2 mr-4">
            {[...Array(Math.min(3, program.participants || 3))].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs text-white overflow-hidden"
              >
                <img
                  src={`https://picsum.photos/id/${i + 50}/100/100`}
                  alt="Participant"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {program.participants > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                +{program.participants - 3}
              </div>
            )}
          </div>
          <button className="ml-auto text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 flex items-center transition-colors">
            View Details <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgramCard;