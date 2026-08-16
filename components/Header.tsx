'use client';

import React from 'react';
import { Menu, Download, Sparkles, User, LogOut, Cpu, Bot } from 'lucide-react';
import { ZytechLogo } from './ZytechLogo';

interface HeaderProps {
  onToggleSidebar: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onExportChat: () => void;
  userEmail: string | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  selectedModel,
  onModelChange,
  onExportChat,
  userEmail,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header className="h-16 px-4 md:px-6 flex justify-between items-center z-10 shrink-0 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl sticky top-0 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 transition-colors"
          title="Buka / Tutup Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <ZytechLogo className="w-8 h-8" glow={false} />
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-zytech-pink to-zytech-indigo bg-clip-text text-transparent">
            Zytech AI
          </span>

          <div className="relative ml-2 hidden sm:block">
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 rounded-full px-3 py-1.5 cursor-pointer outline-none hover:border-indigo-500 dark:hover:border-indigo-500 transition-all appearance-none pr-8 shadow-xs"
            >
              <option value="gemini-1.5-flash">Zytech Flash (Cepat)</option>
              <option value="gemini-1.5-pro">Zytech Pro (Analitis)</option>
              <option value="gemini-2.0-flash">Zytech 2.0 (Terbaru)</option>
            </select>
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Export Chat */}
        <button
          onClick={onExportChat}
          title="Download Percakapan (.txt)"
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Live Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Online</span>
        </div>

        {/* User Account State */}
        {userEmail ? (
          <div className="flex items-center gap-2 pl-2">
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-md"
              title={userEmail}
            >
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-indigo-500/20"
          >
            <User className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
