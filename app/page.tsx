'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar, ChatSessionItem } from '@/components/Sidebar';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { ChatBox, ChatMessage } from '@/components/ChatBox';
import { ChatInput } from '@/components/ChatInput';
import { AuthModal } from '@/components/AuthModal';
import { ToastProvider, useToast } from '@/components/Toast';

function ChatInterface() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { showToast } = useToast();

  // Auth & Session state
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Chat state
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');

  // Handle responsive sidebar defaults
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    // Initialize
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
    initSession();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUserEmail(data.user.email);
        fetchSessions(data.user.email);
      }
    } catch (e) {
      console.error('Auth check error:', e);
    }
  };

  const initSession = async () => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail || 'GUEST' }),
      });
      const data = await res.json();
      if (data.session_id) {
        setCurrentSessionId(data.session_id);
      }
    } catch (err) {
      console.error('Session init error:', err);
    }
  };

  const fetchSessions = async (email: string, query: string = '') => {
    try {
      const url = `/api/sessions?email=${encodeURIComponent(email)}&query=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        setSessions(data.data);
      }
    } catch (e) {
      console.error('Fetch sessions error:', e);
    }
  };

  const loadChatHistory = async (sessionId: string) => {
    if (!sessionId || sessionId.startsWith('guest_')) {
      setMessages([]);
      return;
    }

    try {
      const res = await fetch(`/api/messages?session_id=${encodeURIComponent(sessionId)}`);
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        setMessages(data.data);
      }
    } catch (e) {
      console.error('Load chat history error:', e);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    loadChatHistory(sessionId);
    // Close sidebar on mobile drawer selection
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleNewChat = () => {
    initSession();
    setMessages([]);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
    showToast('Percakapan baru dimulai', 'info');
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/sessions?id=${sessionId}`, { method: 'DELETE' });
      showToast('Sesi obrolan dihapus', 'info');
      if (userEmail) fetchSessions(userEmail, searchQuery);
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Delete session error:', err);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (userEmail) {
      fetchSessions(userEmail, query);
    }
  };

  const handleSendMessage = async (text: string, file: File | null) => {
    if (!currentSessionId) return;

    // Display user message immediately
    const userMsg: ChatMessage = {
      sender: 'Kamu',
      teks: text,
      fileUrl: file ? file.name : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', userEmail || 'GUEST');
      formData.append('session_id', currentSessionId);
      formData.append('message', text);
      formData.append('model', selectedModel);
      if (file) {
        formData.append('file', file);
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      const aiReply = data.reply || 'Maaf, terjadi kesalahan saat menerima respon dari Zytech AI.';

      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].sender === 'Kamu') {
          updated[lastIndex] = {
            ...updated[lastIndex],
            id: data.userMessageId,
          };
        }
        return [...updated, { id: data.aiMessageId, sender: 'AI', teks: aiReply }];
      });

      // Refresh sidebar list if user is logged in
      if (userEmail) {
        fetchSessions(userEmail, searchQuery);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: 'AI', teks: `Error sistem: ${err.message || 'Gagal mengirim pesan'}` },
      ]);
      showToast('Gagal memproses pesan', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = async (index: number, newText: string) => {
    if (!currentSessionId) return;

    const targetMsg = messages[index];
    if (!targetMsg || (targetMsg.sender !== 'Kamu' && targetMsg.sender !== 'user')) return;

    const updatedUserMsg: ChatMessage = {
      ...targetMsg,
      teks: newText,
    };

    const truncatedMessages = messages.slice(0, index);
    setMessages([...truncatedMessages, updatedUserMsg]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', userEmail || 'GUEST');
      formData.append('session_id', currentSessionId);
      formData.append('message', newText);
      formData.append('model', selectedModel);
      formData.append('is_edit', 'true');
      if (targetMsg.id) {
        formData.append('message_id', targetMsg.id);
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      const aiReply = data.reply || 'Maaf, terjadi kesalahan saat menerima respon dari Zytech AI.';

      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && (updated[lastIndex].sender === 'Kamu' || updated[lastIndex].sender === 'user')) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            id: data.userMessageId || targetMsg.id,
          };
        }
        return [...updated, { id: data.aiMessageId, sender: 'AI', teks: aiReply }];
      });

      if (userEmail) {
        fetchSessions(userEmail, searchQuery);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: 'AI', teks: `Error sistem: ${err.message || 'Gagal mengubah pesan'}` },
      ]);
      showToast('Gagal memproses perubahan pesan', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (messages.length < 2) return;
    const lastUserMessage = [...messages].reverse().find((m) => m.sender === 'Kamu' || m.sender === 'user');
    if (lastUserMessage) {
      // Remove last AI response
      setMessages((prev) => prev.slice(0, -1));
      handleSendMessage(lastUserMessage.teks, null);
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) {
      showToast('Belum ada percakapan untuk diunduh', 'info');
      return;
    }

    const content = messages
      .map((m) => `[${m.sender}]: ${m.teks}${m.fileUrl ? `\n(File: ${m.fileUrl})` : ''}`)
      .join('\n\n-----------------------------------\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Zytech_AI_Chat_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File percakapan berhasil diunduh (.txt)', 'success');
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    showToast(`Model AI diganti ke ${model}`, 'info');
  };

  const handleAuthSuccess = (email: string, token: string) => {
    setUserEmail(email);
    fetchSessions(email);
  };

  const handleLogout = () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUserEmail(null);
    setSessions([]);
    handleNewChat();
    showToast('Anda telah logout', 'info');
  };

  return (
    <div className="flex h-screen h-[100dvh] w-full overflow-hidden bg-zinc-50 dark:bg-[#09090b]">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        userEmail={userEmail}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Content View */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300">
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          onExportChat={handleExportChat}
          userEmail={userEmail}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 flex flex-col relative overflow-hidden">
          {messages.length === 0 ? (
            <WelcomeScreen onSelectPrompt={(p) => handleSendMessage(p, null)} />
          ) : (
            <ChatBox
              messages={messages}
              isLoading={isLoading}
              onRegenerate={handleRegenerate}
              onEditMessage={handleEditMessage}
            />
          )}

          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <ChatInterface />
    </ToastProvider>
  );
}
