'use client';

import React from 'react';
import { Menu, Download, User, LogOut, ChevronDown, Plus } from 'lucide-react';
import { ZytechLogo } from './ZytechLogo';

interface HeaderProps {
  onToggleSidebar: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onExportChat: () => void;
  userEmail: string | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onNewChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  selectedModel,
  onModelChange,
  onExportChat,
  userEmail,
  onOpenAuth,
  onLogout,
  onNewChat,
}) => {
  return (
    <header className="h-16 px-3 sm:px-4 md:px-6 flex justify-between items-center z-10 shrink-0 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl sticky top-0 transition-colors">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onToggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 transition-colors"
          title="Buka / Tutup Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <ZytechLogo className="w-7 h-7" glow={false} />
          
          <div className="relative flex items-center">
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="bg-transparent text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-100 cursor-pointer outline-none appearance-none pr-5.5 py-1 select-none hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <option value="gemini-1.5-flash" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">Zytech Flash</option>
              <option value="gemini-1.5-pro" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">Zytech Pro</option>
              <option value="gemini-2.0-flash" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">Zytech 2.0</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 absolute right-0.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          title="Percakapan Baru"
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Export Chat */}
        <button
          onClick={onExportChat}
          title="Download Percakapan (.txt)"
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Live Status Indicator - Shown only on desktop */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Online</span>
        </div>

        {/* User Account State */}
        {userEmail ? (
          <div className="flex items-center gap-1.5 pl-1.5">
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-xs shadow-md"
              title={userEmail}
            >
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-sm hover:shadow-indigo-500/20"
          >
            <User className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
