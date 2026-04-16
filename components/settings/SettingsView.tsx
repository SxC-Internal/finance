'use client'

import React from 'react';
import { Moon, Sun, Shield, Mail, Briefcase, User as UserIcon } from 'lucide-react';
import type { Theme, User } from '../../types';

interface SettingsViewProps {
  theme: Theme;
  onToggleTheme: () => void;
  user: User;
}

const SettingsView: React.FC<SettingsViewProps> = ({ theme, onToggleTheme, user }) => (
  <div className="space-y-8 animate-fade-in max-w-4xl">
    <div>
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Settings</h2>
      <p className="text-slate-500 dark:text-slate-400">Manage your preferences and account settings.</p>
    </div>

    <div className="grid gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none">
        <div className="flex items-center mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mr-4">
            {theme === 'dark' ? (
              <Moon className="text-blue-600 dark:text-blue-400" size={24} />
            ) : (
              <Sun className="text-orange-500" size={24} />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Appearance</h3>
            <p className="text-slate-500 text-sm">Customize how the application looks.</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Interface Theme</p>
            <p className="text-sm text-slate-500">Select your preferred display mode.</p>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={onToggleTheme}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Light
            </button>
            <button
              onClick={onToggleTheme}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Dark
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none">
        <div className="flex items-center mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg mr-4">
            <Shield className="text-emerald-600 dark:text-emerald-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Account Info</h3>
            <p className="text-slate-500 text-sm">Your verified credentials.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
            <div className="flex items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <UserIcon size={16} className="mr-2 opacity-50" /> {user.name}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="flex items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <Mail size={16} className="mr-2 opacity-50" /> {user.email}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role Access</label>
            <div className="flex items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase">
              <Shield size={16} className="mr-2 opacity-50" /> {user.role}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Department</label>
            <div className="flex items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase">
              <Briefcase size={16} className="mr-2 opacity-50" /> {user.departmentId || 'Global Admin'}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SettingsView;
