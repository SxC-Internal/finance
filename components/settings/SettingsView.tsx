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
    <div className="max-w-xl space-y-4">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Settings</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Preferences and account</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/50 divide-y divide-slate-100 dark:divide-slate-700/50 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/80">
          <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
            {theme === 'dark'
              ? <Moon size={13} className="text-blue-500 dark:text-blue-400" />
              : <Sun size={13} className="text-orange-500" />}
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Appearance</span>
        </div>

        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Interface Theme</p>
            <p className="text-xs text-slate-400 mt-0.5">Light or dark display mode</p>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-md p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => theme === 'dark' && onToggleTheme()}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => theme === 'light' && onToggleTheme()}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              Dark
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/50 divide-y divide-slate-100 dark:divide-slate-700/50 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/80">
          <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
            <Shield size={13} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Account</span>
        </div>

        <div className="px-4 py-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Display Name</p>
            {status === 'success' && (
              <span className="text-xs text-emerald-500">Saved</span>
            )}
            {status === 'error' && (
              <span className="text-xs text-red-500">{errorMsg}</span>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex items-center flex-1 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
              <UserIcon size={13} className="ml-3 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
                className="flex-1 bg-transparent px-2 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
              />
            </div>
            <button
              onClick={() => save(displayName)}
              disabled={status === 'saving'}
              className="px-3 py-2 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {status === 'saving' ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => save(null)}
              disabled={status === 'saving'}
              className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
