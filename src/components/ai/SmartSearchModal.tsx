'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Sparkles,
  X,
  Award,
  FolderGit2,
  Trophy,
  StickyNote,
  FileText,
  ArrowRight,
  Send,
  Bot,
} from 'lucide-react';
import { ArchiveItemDTO } from '@/types';
import { getItemTypeColor } from '@/lib/utils';

interface SmartSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem?: (item: ArchiveItemDTO) => void;
}

export default function SmartSearchModal({
  isOpen,
  onClose,
  onSelectItem,
}: SmartSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'ask'>('search');

  // Conversational Q&A state
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setQuestion('');
      setAnswer('');
    }
  }, [isOpen]);

  // Keyboard shortcut Cmd+K or Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await fetch('/api/ai/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    try {
      setIsAsking(true);
      const res = await fetch('/api/ai/ask-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnswer(data.answer);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAsking(false);
    }
  };

  if (!isOpen) return null;

  const getItemIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'CERTIFICATE':
        return <Award className="w-4 h-4 text-emerald-400" />;
      case 'PROJECT':
        return <FolderGit2 className="w-4 h-4 text-indigo-400" />;
      case 'ACHIEVEMENT':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'NOTE':
        return <StickyNote className="w-4 h-4 text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mode Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-1">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'search'
                ? 'bg-indigo-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Semantic Search</span>
          </button>
          <button
            onClick={() => setActiveTab('ask')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ask'
                ? 'bg-cyan-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask Archive AI</span>
          </button>

          <button
            onClick={onClose}
            className="ml-auto p-2 text-slate-400 hover:text-white rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Semantic Search Tab */}
        {activeTab === 'search' && (
          <div>
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-indigo-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Ask or search: 'Python certificates from 2024', 'realtime web app'..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
              {query && (
                <button onClick={() => handleSearch('')} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results container */}
            <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-800/60">
              {isSearching ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
                  <p>Calculating semantic embeddings and keyword vectors...</p>
                </div>
              ) : results.length > 0 ? (
                results.map((r) => {
                  const it: ArchiveItemDTO = r.item;
                  const typeStyle = getItemTypeColor(it.itemType);
                  return (
                    <div
                      key={it.id}
                      onClick={() => {
                        onClose();
                        router.push(`/archive`);
                        onSelectItem?.(it);
                      }}
                      className="p-3 rounded-2xl hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`p-2 rounded-xl border flex-shrink-0 ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                        >
                          {getItemIcon(it.itemType)}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                            {it.title}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {r.matchReason}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 font-bold border border-indigo-500/30">
                          {Math.round(r.score * 100)}% Match
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })
              ) : query ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No records matched "{query}". Try searching with different terms or skills.
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  Type a natural language query or concept to search through your entire personal archive.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ask Archive AI Tab */}
        {activeTab === 'ask' && (
          <div className="p-6 space-y-4">
            <form onSubmit={handleAskAI} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Ask a question about your documents, certificates, or achievements:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Which cloud certs do I have and when do they expire?"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={isAsking || !question.trim()}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-glow-cyan transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAsking ? 'Thinking...' : 'Ask'}</span>
                </button>
              </div>
            </form>

            {answer && (
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                  <Bot className="w-4 h-4" />
                  <span>Archive AI Answer:</span>
                </div>
                <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {answer}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
