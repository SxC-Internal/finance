"use client";
import React from "react";
import { Hand } from "lucide-react";
import { signIn } from "@/lib/auth-client";

const LoginView: React.FC = () => {
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
            Sign in with your organizational Google account to access the dashboard.
          </p>

          <button
            type="button"
            onClick={async () => {
              await signIn.social({
                provider: "google",
                callbackURL: "/",
              });
            }}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 font-semibold py-4 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
