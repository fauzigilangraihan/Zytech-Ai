'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { ZytechLogo } from './ZytechLogo';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = () => {
  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center text-center max-w-4xl mx-auto py-12 px-4 animate-fade-in">
      <ZytechLogo className="w-24 h-24 mb-8" glow={true} />

      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/20 mb-4 animate-pulse">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Kecerdasan Buatan Generasi Baru</span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-black bg-gradient-to-r from-zytech-yellow via-zytech-pink to-zytech-indigo bg-clip-text text-transparent mb-4 tracking-tight leading-tight">
        Selamat Datang di Zytech AI
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg max-w-2xl font-medium leading-relaxed">
        Asisten virtual cerdas yang siap membantu menyelesaikan koding, analisis data, ide kreatif, hingga tugas harianmu secara presisi.
      </p>
    </div>
  );
};
