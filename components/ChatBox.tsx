'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, Paperclip, Bot, User, Volume2, VolumeX, RotateCcw, Pencil } from 'lucide-react';
import { useToast } from '@/components/Toast';

export interface ChatMessage {
  id?: string;
  sender: 'Kamu' | 'AI' | 'user' | 'model';
  teks: string;
  fileUrl?: string;
}

interface ChatBoxProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onRegenerate?: () => void;
  onEditMessage?: (index: number, newText: string) => void;
}

const extractText = (node: any): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return node.toString();
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && node.props && node.props.children) return extractText(node.props.children);
  return '';
};

interface PreBlockProps {
  children: React.ReactNode;
}

const PreBlock: React.FC<PreBlockProps> = ({ children }) => {
  const [copied, setCopied] = useState(false);

  // Extract language from <code> element className
  let language = '';
  try {
    const codeElement = React.Children.only(children) as React.ReactElement;
    const className = codeElement?.props?.className || '';
    const match = /language-(\w+)/.exec(className);
    if (match) language = match[1];
  } catch (e) {}

  const handleCopy = () => {
    const text = extractText(children);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-[#0a0b22] shadow-md">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#060716] border-b border-zinc-800/50 text-zinc-400 text-xs font-mono select-none">
        <span className="font-semibold uppercase tracking-wider text-zinc-500 text-[10px]">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white transition-colors duration-200 py-1 px-2 rounded-md hover:bg-zinc-800/40"
          title="Salin Kode"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="font-medium">Salin kode</span>
            </>
          )}
        </button>
      </div>
      <pre className="!m-0 !p-4 !bg-transparent !border-0 overflow-x-auto">
        {children}
      </pre>
    </div>
  );
};

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, isLoading, onRegenerate, onEditMessage }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>('');
  const { showToast } = useToast();

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast('Teks pesan berhasil disalin!', 'success');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSpeak = (text: string, index: number) => {
    if (!('speechSynthesis' in window)) {
      showToast('Browser Anda belum mendukung Text-to-Speech.', 'error');
      return;
    }

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`_]/g, ''));
    utterance.lang = 'id-ID';
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveEdit = (index: number) => {
    if (onEditMessage && editText.trim() && editText.trim() !== messages[index].teks) {
      onEditMessage(index, editText.trim());
    }
    setEditingIndex(null);
  };

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 pb-36 space-y-6">
      {messages.map((msg, index) => {
        const isUser = msg.sender === 'Kamu' || msg.sender === 'user';
        const isEditing = editingIndex === index;
        return (
          <div
            key={index}
            className={`flex gap-3 md:gap-4 max-w-4xl mx-auto animate-fade-in ${
              isUser ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-black text-xs shadow-md border ${
                isUser
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/20'
                  : 'bg-gradient-to-tr from-violet-600 to-indigo-600 border-violet-500 text-white shadow-violet-600/20'
              }`}
            >
              {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble Container */}
            <div
              className={`relative group max-w-[85%] sm:max-w-[78%] md:max-w-[82%] rounded-2xl p-4 md:p-5 text-sm leading-relaxed transition-all ${
                isUser
                  ? 'bg-indigo-600 text-white shadow-lg rounded-tr-none'
                  : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800 rounded-tl-none shadow-sm'
              }`}
            >
              {/* File Attachment Badge */}
              {msg.fileUrl && (
                <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl bg-black/10 dark:bg-white/10 text-xs font-semibold w-fit">
                  <Paperclip className="w-4 h-4 text-indigo-400" />
                  <span className="truncate max-w-[220px]">{msg.fileUrl}</span>
                </div>
              )}

              {/* Message Text */}
              {isUser ? (
                isEditing ? (
                  <div className="w-full flex flex-col gap-2 mt-1">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full min-h-[80px] p-3 rounded-xl bg-indigo-700 text-white placeholder-indigo-300 border border-indigo-500 focus:outline-none focus:ring-2 focus:ring-white/50 resize-y font-medium text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-700/60 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleSaveEdit(index)}
                        disabled={!editText.trim() || editText.trim() === msg.teks}
                        className="px-3 py-1.5 rounded-lg bg-white text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:hover:bg-white text-xs font-semibold transition-colors shadow-sm"
                      >
                        Simpan & Kirim
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words font-medium">{msg.teks}</p>
                )
              ) : (
                <div className="prose dark:prose-invert max-w-none text-xs md:text-sm font-normal">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      pre: ({ children }) => <PreBlock>{children}</PreBlock>,
                    }}
                  >
                    {msg.teks}
                  </ReactMarkdown>
                </div>
              )}

              {/* Action Toolbar on Hover */}
              {!isEditing && (
                <div
                  className={`flex items-center gap-1 mt-3 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity ${
                    isUser
                      ? 'border-white/20 text-white/80'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-400'
                  }`}
                >
                  <button
                    onClick={() => handleCopy(msg.teks, index)}
                    className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-xs flex items-center gap-1"
                    title="Salin pesan"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {isUser && onEditMessage && (
                    <button
                      onClick={() => {
                        setEditingIndex(index);
                        setEditText(msg.teks);
                      }}
                      className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-xs flex items-center gap-1"
                      title="Edit pesan"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!isUser && (
                    <>
                      <button
                        onClick={() => handleSpeak(msg.teks, index)}
                        className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-xs"
                        title={speakingIndex === index ? 'Hentikan Suara' : 'Dengarkan Suara'}
                      >
                        {speakingIndex === index ? (
                          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {onRegenerate && index === messages.length - 1 && (
                        <button
                          onClick={onRegenerate}
                          className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-xs flex items-center gap-1"
                          title="Buat Ulang Balasan"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Thinking state */}
      {isLoading && (
        <div className="flex gap-3 md:gap-4 max-w-4xl mx-auto items-center animate-fade-in">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 border border-violet-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-600/20">
            <Bot className="w-4 h-4" />
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-2 shadow-sm">
            <span className="text-xs font-semibold text-zinc-400 mr-1">Zytech AI berpikir...</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce [animation-delay:0.4s]"></span>
          </div>
        </div>
      )}


    </div>
  );
};
