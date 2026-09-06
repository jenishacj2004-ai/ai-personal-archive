'use client';

import React, { useState, useEffect } from 'react';
import {
  StickyNote,
  Plus,
  Save,
  Sparkles,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  CheckSquare,
  FileText,
} from 'lucide-react';
import { ArchiveItemDTO, CategoryDTO } from '@/types';
import ItemDetailModal from '@/components/archive/ItemDetailModal';
import EditItemModal from '@/components/archive/EditItemModal';
import DeleteConfirmModal from '@/components/archive/DeleteConfirmModal';
import { formatDate } from '@/lib/utils';

export default function NotesPage() {
  const [notes, setNotes] = useState<ArchiveItemDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Note Creator State
  const [showCreator, setShowCreator] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Modals state
  const [viewItem, setViewItem] = useState<ArchiveItemDTO | null>(null);
  const [editItem, setEditItem] = useState<ArchiveItemDTO | null>(null);
  const [deleteItem, setDeleteItem] = useState<ArchiveItemDTO | null>(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const [itemRes, catRes] = await Promise.all([
        fetch('/api/items?type=NOTE'),
        fetch('/api/categories'),
      ]);

      if (itemRes.ok) {
        const data = await itemRes.json();
        setNotes(data.items || []);
      }
      if (catRes.ok) {
        const cData = await catRes.json();
        setCategories(cData.categories || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      setIsSaving(true);
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          itemType: 'NOTE',
          description: newContent.slice(0, 200),
          categoryId: newCategoryId || undefined,
          specializedData: {
            markdownContent: newContent,
          },
        }),
      });

      if (res.ok) {
        setNewTitle('');
        setNewContent('');
        setShowCreator(false);
        fetchNotes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <StickyNote className="w-7 h-7 text-purple-400" />
            <span>Smart Notes & Logs</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Capture architectural thoughts, interview checklists, and study summaries with AI auto-tagging.
          </p>
        </div>

        <button
          onClick={() => setShowCreator(!showCreator)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{showCreator ? 'Close Note Editor' : 'Create Quick Note'}</span>
        </button>
      </div>

      {/* Quick Note Creator Drawer */}
      {showCreator && (
        <form
          onSubmit={handleCreateNote}
          className="p-6 rounded-3xl bg-slate-900 border border-purple-500/30 space-y-4 shadow-2xl animate-in slide-in-from-top-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Create AI-Summarized Note</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCreator(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Note Title (e.g. Distributed Caching Strategies)"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 outline-none"
              />
            </div>
            <div>
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="">Category (Optional)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            rows={5}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="# Markdown notes...&#10;- Key concept 1&#10;- Key concept 2"
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-purple-500 outline-none resize-none"
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreator(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Indexing Note...' : 'Save & AI Index'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-3xl bg-slate-900/50 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mx-auto flex items-center justify-center">
            <StickyNote className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Notes Recorded Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Start writing architectural thoughts, study cheat sheets, and checklists.
            </p>
          </div>
          <button
            onClick={() => setShowCreator(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Note</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => setViewItem(note)}
              className="p-5 rounded-3xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Smart Note
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setEditItem(note)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteItem(note)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors line-clamp-1 mb-2">
                  {note.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                  {note.aiSummary || note.description || note.noteMeta?.markdownContent}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>{formatDate(note.createdAt)}</span>
                {note.tags && note.tags.length > 0 && (
                  <span className="text-purple-400 font-medium">#{note.tags[0].tag.name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
        onRefresh={fetchNotes}
      />

      <EditItemModal
        item={editItem}
        categories={categories}
        onClose={() => setEditItem(null)}
        onSave={async (data) => {
          if (!editItem) return;
          await fetch(`/api/items/${editItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          fetchNotes();
        }}
      />

      <DeleteConfirmModal
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={async (it) => {
          await fetch(`/api/items/${it.id}`, { method: 'DELETE' });
          fetchNotes();
        }}
      />
    </div>
  );
}
