'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Bot,
  Send,
  ArrowRight,
  Award,
  FolderGit2,
  Trophy,
  StickyNote,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { ArchiveItemDTO } from '@/types';
import ItemDetailModal from '@/components/archive/ItemDetailModal';
import EditItemModal from '@/components/archive/EditItemModal';
import DeleteConfirmModal from '@/components/archive/DeleteConfirmModal';
import { getItemTypeColor } from '@/lib/utils';

const SUGGESTED_QUERIES = [
  'Cloud architecture certificates from AWS',
  'Full-stack projects using React and TypeScript',
  'National hackathon awards and achievements',
  'Distributed system design notes',
  'Certificates with Python and machine learning',
];

export default function SemanticSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Conversational Assistant
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // Modals state
  const [viewItem, setViewItem] = useState<ArchiveItemDTO | null>(null);
  const [editItem, setEditItem] = useState<ArchiveItemDTO | null>(null);
  const [deleteItem, setDeleteItem] = useState<ArchiveItemDTO | null>(null);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) return;

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

  const handleAsk = async (e: React.FormEvent) => {
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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Vector & Hybrid Neural Retrieval</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Semantic Search & Knowledge Assistant
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Query your personal records by semantic meaning rather than exact keywords. Ask questions directly over all stored documents.
        </p>
      </div>

      {/* Main Search Input */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="w-5 h-5 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by topic, skill, or concept (e.g. 'Cloud infrastructure with Python')..."
          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none shadow-2xl transition-all"
        />
      </div>

      {/* Suggested Search Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
        <span className="text-[11px] text-slate-500 font-semibold">Try asking:</span>
        {SUGGESTED_QUERIES.map((sq) => (
          <button
            key={sq}
            onClick={() => handleSearch(sq)}
            className="text-xs px-3 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            "{sq}"
          </button>
        ))}
      </div>

      {/* Conversational Q&A Box */}
      <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-md space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
          <Bot className="w-4 h-4" />
          <span>Ask Archive Q&A Engine</span>
        </div>

        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything: 'What awards did I win?', 'When does my AWS cert expire?'"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
          />
          <button
            type="submit"
            disabled={isAsking || !question.trim()}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-glow-cyan transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isAsking ? 'Thinking...' : 'Ask AI'}</span>
          </button>
        </form>

        {answer && (
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2 animate-in fade-in">
            <div className="text-xs font-bold text-cyan-300">Answer:</div>
            <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
              {answer}
            </p>
          </div>
        )}
      </div>

      {/* Search Results List */}
      <div className="max-w-3xl mx-auto space-y-4">
        {isSearching ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Sparkles className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
            <p>Performing cosine distance vector matching across all archive records...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 text-xs text-slate-400">
              <span>Top {results.length} ranked matches:</span>
            </div>

            {results.map((r) => {
              const it: ArchiveItemDTO = r.item;
              const typeStyle = getItemTypeColor(it.itemType);

              return (
                <div
                  key={it.id}
                  onClick={() => setViewItem(it)}
                  className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer group shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`p-2.5 rounded-xl border flex-shrink-0 ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                    >
                      {getItemIcon(it.itemType)}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {it.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {it.aiSummary || it.description || 'No description recorded.'}
                      </p>
                      <p className="text-[11px] text-indigo-400 mt-2 font-medium">
                        💡 {r.matchReason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                        {Math.round(r.score * 100)}% Match
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : query ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-slate-800">
            <p className="text-xs text-slate-400">No matching records found for "{query}".</p>
          </div>
        ) : null}
      </div>

      {/* Modals */}
      <ItemDetailModal
        item={viewItem}
        onClose={() => setViewItem(null)}
        onEdit={(it) => {
          setViewItem(null);
          setEditItem(it);
        }}
        onDelete={(it) => {
          setViewItem(null);
          setDeleteItem(it);
        }}
      />

      <EditItemModal
        item={editItem}
        categories={[]}
        onClose={() => setEditItem(null)}
        onSave={async (data) => {
          if (!editItem) return;
          await fetch(`/api/items/${editItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (query) handleSearch(query);
        }}
      />

      <DeleteConfirmModal
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={async (it) => {
          await fetch(`/api/items/${it.id}`, { method: 'DELETE' });
          if (query) handleSearch(query);
        }}
      />
    </div>
  );
}
