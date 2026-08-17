'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { ZytechLogo } from './ZytechLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || data.status === 'error') {
        throw new Error(data.message || 'Terjadi kesalahan');
      }

      if (mode === 'register') {
        setMode('login');
        showToast('Registrasi berhasil! Silakan login.', 'success');
        setErrorMsg('Registrasi berhasil! Silakan login.');
      } else {
        showToast(`Selamat datang kembali, ${data.email}!`, 'success');
        onSuccess(data.email, data.token);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghubungkan ke server');
      showToast(err.message || 'Gagal autentikasi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-50 cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5 pointer-events-none" />
        </button>

        <div className="text-center mb-6">
          <ZytechLogo className="w-16 h-16 mb-4 mx-auto" glow={true} />
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {mode === 'login' ? 'Masuk ke Zytech AI' : 'Buat Akun Zytech AI'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Simpan riwayat obrolan & akses fitur di mana saja
          </p>
        </div>

        {errorMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold mb-4 ${
              errorMsg.includes('berhasil')
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs font-medium text-zinc-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs font-medium text-zinc-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 mt-2 disabled:opacity-50 text-xs flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{mode === 'login' ? 'Masuk Sekarang' : 'Daftar Akun'}</span>
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setErrorMsg('');
            }}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            {mode === 'login' ? 'Daftar sekarang' : 'Masuk di sini'}
          </button>
        </div>
      </div>
    </div>
  );
};
