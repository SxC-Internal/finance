'use client'

import React, { useState } from 'react';
import { Moon, Sun, Shield, User as UserIcon } from 'lucide-react';
import type { Theme, User } from '../../types';

interface SettingsViewProps {
  theme: Theme;
  onToggleTheme: () => void;
  user: User;
  onRefreshUser: () => Promise<void>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ theme, onToggleTheme, user, onRefreshUser }) => {
  const [displayName, setDisplayName] = useState(user.name);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const save = async (nameValue: string | null) => {
    setStatus('saving');
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: nameValue }),
      });
      if (!res.ok) {
        const payload = await res.json() as { error?: string };
        throw new Error(payload.error ?? 'Save failed');
      }
      await onRefreshUser();
      if (nameValue === null) setDisplayName(user.name);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Unexpected error');
      setStatus('error');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
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

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
            <div className="flex gap-2">
              <div className="flex items-center flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <UserIcon size={16} className="ml-3 opacity-50 flex-shrink-0 text-slate-700 dark:text-slate-300" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={60}
                  className="flex-1 bg-transparent px-2 py-3 text-slate-700 dark:text-slate-300 focus:outline-none"
                />
              </div>
              <button
                onClick={() => save(displayName)}
                disabled={status === 'saving'}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {status === 'saving' ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => save(null)}
                disabled={status === 'saving'}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                Reset
              </button>
            </div>
            {status === 'success' && (
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Display name updated.</p>
            )}
            {status === 'error' && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
