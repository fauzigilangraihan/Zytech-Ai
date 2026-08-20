'use client';

import React, { useRef, useState } from 'react';
import { Send, Paperclip, Mic, X, Loader2, Plus } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface ChatInputProps {
  onSendMessage: (message: string, file: File | null) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      showToast(`File ${selectedFile.name} terlampir`, 'info');
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!message.trim() && !file) || isLoading) return;

    onSendMessage(message, file);
    setMessage('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  // Voice Speech Recognition handler
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Browser Anda belum mendukung Speech Recognition.', 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    recognition.onstart = () => {
      setIsListening(true);
      showToast('Mendengarkan... Bicara sekarang', 'info');
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 bg-gradient-to-t from-zinc-50 dark:from-[#09090b] via-zinc-50/90 dark:via-[#09090b]/90 to-transparent z-20">
      <div className="max-w-4xl mx-auto w-full">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-[28px] p-1.5 pl-2.5 pr-1.5 sm:pr-2 shadow-2xl transition-all focus-within:ring-2 focus-within:ring-indigo-500/30 flex flex-col gap-1"
        >
          {/* File Attachment Pill */}
          {file && (
            <div className="flex items-center gap-2 mb-2 ml-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold w-fit border border-indigo-500/20">
              <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
              <span className="max-w-[200px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="hover:text-rose-500 transition-colors ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Left Add/Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 transition-colors shrink-0"
              title="Lampirkan Gambar/File"
            >
              <Plus className="w-5.5 h-5.5" />
            </button>

            {/* Main Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan untuk Zytech AI..."
              rows={1}
              className="flex-1 bg-transparent text-sm sm:text-base text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none resize-none py-2 max-h-40 font-medium leading-relaxed"
            />

            {/* Right Dynamic Action Button */}
            <div className="flex items-center shrink-0">
              {isLoading ? (
                <div className="p-2 rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                </div>
              ) : (message.trim() || file) ? (
                <button
                  type="submit"
                  className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 hover:scale-105 transition-all"
                  title="Kirim pesan"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors ${
                    isListening ? 'mic-active' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                  title="Input Suara"
                >
                  <Mic className="w-5.5 h-5.5" />
                </button>
              )}
            </div>
          </div>
        </form>
        <p className="text-[10px] text-center text-zinc-400 dark:text-zinc-500 mt-2 font-medium">
          Zytech AI dapat menghasilkan respon cepat. Periksa kembali informasi krusial.
        </p>
      </div>
    </div>
  );
};
