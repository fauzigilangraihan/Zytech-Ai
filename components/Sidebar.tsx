'use client';

import React, { useState } from 'react';
import { Plus, Search, MessageSquare, Trash2, Sun, Moon, UserCheck, LogIn, X, Edit3, Check } from 'lucide-react';

export interface ChatSessionItem {
  id: string;
  title: string;
  createdAt?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSessionItem[];
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userEmail: string | null;
  onOpenAuth: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  searchQuery,
  onSearchChange,
  userEmail,
  onOpenAuth,
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 bg-zinc-50 dark:bg-zytech-darksidebar border-r border-zinc-200/80 dark:border-zinc-800/80 flex flex-col h-full z-40 transition-all duration-300 ease-in-out overflow-hidden md:relative ${
          isOpen
            ? 'translate-x-0 w-[280px] opacity-100'
            : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:pointer-events-none md:border-r-0'
        }`}
      >
        <div className="w-[280px] flex flex-col h-full shrink-0">
          <div className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center md:hidden">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Navigasi</span>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={onNewChat}
              className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 via-zytech-purple to-zytech-pink hover:opacity-90 text-white shadow-md shadow-indigo-600/20 px-4 py-3 rounded-2xl text-xs font-bold transition-all transform hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              <span>Percakapan Baru</span>
            </button>

            {/* Search bar */}
            <div className="relative mt-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari percakapan..."
                className="w-full bg-white dark:bg-zytech-darkbg border border-zinc-200/80 dark:border-zinc-800/60 rounded-xl py-2 pl-9 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sessions History List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
            <div className="text-[10px] font-extrabold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase px-3 pt-2 pb-1">
              Riwayat Obrolan
            </div>

            {sessions.length === 0 ? (
              <div className="px-3 py-6 text-xs text-zinc-400 dark:text-zinc-500 italic text-center">
                {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada riwayat'}
              </div>
            ) : (
              sessions.map((session) => {
                const isActive = session.id === currentSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/25'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-950/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-indigo-500' : 'text-zinc-400'
                      }`}
                    />
                    <span className="truncate">{session.title}</span>
                  </div>

                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    title="Hapus obrolan"
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-opacity rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & options */}
        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col gap-1">
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-900 transition-colors text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            {userEmail ? (
              <>
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <span className="truncate">{userEmail}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-indigo-500" />
                <span>Login ke Akun</span>
              </>
            )}
          </button>

          <button
            onClick={onToggleTheme}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-900 transition-colors text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Mode Terang</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>Mode Gelap</span>
              </>
            )}
          </button>
        </div>
      </div>
      </aside>
    </>
  );
};
