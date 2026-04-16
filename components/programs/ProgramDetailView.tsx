"use client";

import React from "react";
import { ArrowLeft, Users, Calendar, Award, CheckCircle, Edit, Trash2 } from "lucide-react";
import type { Program, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Assuming you have this helper available from lib/programs
const getProgramStatusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30';
    case 'completed': return 'bg-slate-500/20 text-slate-200 border-slate-500/30';
    case 'upcoming': return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
    default: return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
  }
};

interface ProgramDetailViewProps {
  program: Program;
  user: User;
  onBack: () => void;
}

const ProgramDetailView: React.FC<ProgramDetailViewProps> = ({ program, user, onBack }) => {
  // Check if the current user is an admin
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
      {/* Back Navigation */}
      <button 
        onClick={onBack}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
        Back to Programs
      </button>

      {/* Hero Header */}
      <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
        {/* Mock Hero Image (Placeholder representing the program) */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1540317580384-e5d43867caa6?w=1200&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071838]/90 via-[#071838]/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-8 w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-white/30 px-3 py-1 text-sm">
                  {program.batch}
                </Badge>
                <span className={`text-xs px-3 py-1 rounded-md border font-semibold ${getProgramStatusClass(program.status)}`}>
                  {program.status}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                {program.title}
              </h1>
            </div>

            {/* Admin Actions (Locked out for regular users) */}
            {isAdmin && (
              <div className="flex gap-3">
                <Button variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md">
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" className="bg-red-500/80 hover:bg-red-600 backdrop-blur-md border border-red-500/50">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About this Program</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                {program.description}
              </p>
              
              <div className="mt-8">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Program Progress</h4>
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span className="text-slate-600 dark:text-slate-400">Completion Tracker</span>
                  <span className="text-blue-600 dark:text-blue-400">{program.progress}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${program.progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-xl">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Start Date</p>
                  <p className="text-slate-900 dark:text-white font-bold">{program.startDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Participants</p>
                  <p className="text-slate-900 dark:text-white font-bold">{program.participants} Enrolled</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-purple-50 dark:bg-purple-500/10 p-3 rounded-xl">
                  <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Mentors</p>
                  <p className="text-slate-900 dark:text-white font-bold">{program.mentors} Assigned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions (Contextual based on user type) */}
          <Card className="bg-[#071838] text-white border-none shadow-xl">
            <CardContent className="p-6">
              <h4 className="font-bold mb-2">Ready to contribute?</h4>
              <p className="text-slate-300 text-sm mb-6">
                Access the program repository and participant submissions here.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white border-none">
                Open Workspace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProgramDetailView;