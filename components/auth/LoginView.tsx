"use client";
import React from "react";
import { Hand } from "lucide-react";
import type { User } from "@/types";
import { useLoginForm } from "@/hooks/useLoginForm";

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const { email, setEmail, password, setPassword, error, handleSubmit } =
    useLoginForm(onLogin);

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      <div className="w-full md:w-1/2 bg-slate-900 flex flex-col justify-center items-center p-12 relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-full bg-slate-900 z-0" />
        <div className="absolute top-[-20%] left-[-20%] w-150 h-150 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="z-10 mb-8">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
            <span className="text-4xl text-white font-bold">*</span>
          </div>
        </div>

        <h1 className="z-10 text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Hello <br />
          Students<span className="text-slate-400">X</span>Ceos!
          <Hand
            className="inline-block ml-4 text-yellow-400 animate-pulse"
            size={48}
          />
        </h1>

        <p className="z-10 text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
          Streamline your departmental reviews. Access finance, operations,
          marketing, and HR data in one centralized hub.
        </p>

        <div className="absolute bottom-8 text-slate-600 text-sm">
          &copy; 2026 StudentsXCeos. All rights reserved.
        </div>
      </div>

      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-12">
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-12">
            <div />
            <div className="text-slate-900 font-semibold flex items-center">
              StudentsXCeos Internal
              <div className="ml-2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs">
                S
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Member Login
          </h2>
          <p className="text-slate-500 mb-8">
            Use dummy credentials to access the dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="finance.lead@sxc.ac.id"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {error && <p className="text-rose-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full bg-black text-white font-bold py-4 rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
            >
              Enter
            </button>
          </form>

          <div className="mt-8 text-center bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="text-slate-500 text-xs font-semibold mb-2">
              DUMMY ACCOUNTS
            </p>
            <div className="text-xs text-slate-400 grid grid-cols-1 gap-1 text-center font-mono">
              <span>finance.lead@sxc.ac.id / password</span>
              <span>finance.analyst@sxc.ac.id / password</span>
              <span>hr.director@sxc.ac.id / password</span>
              <span>hr.staff@sxc.ac.id / password</span>
              <span>ops.manager@sxc.ac.id / password</span>
              <span>ops.staff@sxc.ac.id / password</span>
              <span>marketing.head@sxc.ac.id / password</span>
              <span>marketing.staff@sxc.ac.id / password</span>
              <span>tech.lead@sxc.ac.id / password</span>
              <span>tech.analyst@sxc.ac.id / password</span>
              <span>admin@sxc.ac.id / admin</span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
