import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'Zytech AI - Asisten Cerdas Virtual',
  description: 'Zytech AI asisten virtual kecerdasan buatan berbasis Gemini API. Siap membantu koding, analisis, dan solusi tugas sehari-hari.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
