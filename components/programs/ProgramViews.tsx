"use client";
import { useState, useMemo } from "react";
import type { FC } from "react";
import { Search } from "lucide-react";
import { PROGRAMS } from "@/constants";
import ProgramCard from "./ProgramCard";
import NewProgramModal from "./NewProgramModal";
import ProgramDetailView from "./ProgramDetailView";
import type { User, Program } from "@/types";

interface ProgramsViewProps {
  user?: User;
}

const ProgramsView: FC<ProgramsViewProps> = ({ user }) => {
  const [isNewProgramModalOpen, setIsNewProgramModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  
  // NEW: Search State
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = user?.role === "admin";

  // NEW: Filter programs based on the search query
  const filteredPrograms = useMemo(() => {
    if (!searchQuery.trim()) return PROGRAMS;
    
    const query = searchQuery.toLowerCase();
    return PROGRAMS.filter((program) => 
      program.title.toLowerCase().includes(query) ||
      program.batch.toLowerCase().includes(query) ||
      program.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  if (selectedProgram) {
    return (
      <ProgramDetailView 
        program={selectedProgram} 
        user={user!} 
        onBack={() => setSelectedProgram(null)} 
      />
    );
  }

  return (
    <>
      <div className="space-y-8 animate-fade-in p-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Programs & Batches
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Manage ongoing batches, curriculum, and participants.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Contextual Search Bar */}
            <div className="flex items-center bg-white dark:bg-slate-800/50 rounded-lg px-4 py-2 w-full sm:w-72 border border-slate-200 dark:border-slate-700 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-sm">
              <Search size={18} className="text-slate-400 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 w-full"
              />
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsNewProgramModalOpen(true)}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-600/20 whitespace-nowrap"
              >
                + New Program
              </button>
            )}
          </div>
        </div>

        {/* Display Filtered Programs */}
        {filteredPrograms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => (
              <ProgramCard 
                key={program.id} 
                program={program} 
                onClick={() => setSelectedProgram(program)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 text-lg">No programs found matching "{searchQuery}"</p>
            <button 
              onClick={() => setSearchQuery("")}
              className="mt-4 text-blue-500 hover:text-blue-600 font-medium transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <NewProgramModal
          isOpen={isNewProgramModalOpen}
          onClose={() => setIsNewProgramModalOpen(false)}
        />
      )}
    </>
  );
};

export default ProgramsView;