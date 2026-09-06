'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Sparkles,
  Key,
  ShieldCheck,
  Save,
  CheckCircle2,
  RefreshCw,
  Download,
  FolderPlus,
  Trash2,
  User,
  Plus,
} from 'lucide-react';
import { CategoryDTO, UserSession } from '@/types';

export default function SettingsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [fullName, setFullName] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('gemini');
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  const [savingUser, setSavingUser] = useState(false);
  const [userSaved, setUserSaved] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchSettings = async () => {
    try {
      const [userRes, catRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/categories'),
      ]);

      if (userRes.ok) {
        const uData = await userRes.json();
        setUser(uData.user);
        setFullName(uData.user.fullName || '');
        setCustomApiKey(uData.user.customApiKey || '');
        setAiProvider(uData.user.aiProvider || 'gemini');
      }

      if (catRes.ok) {
        const cData = await catRes.json();
        setCategories(cData.categories || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveProfileAndAI = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingUser(true);
      setUserSaved(false);

      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          customApiKey: customApiKey.trim() || null,
          aiProvider,
        }),
      });

      if (res.ok) {
        setUserSaved(true);
        setTimeout(() => setUserSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingUser(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          color: newCatColor,
        }),
      });

      if (res.ok) {
        setNewCatName('');
        fetchSettings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    try {
      const res = await fetch(`/api/categories/${catId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchSettings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      const res = await fetch('/api/system/seed', { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-personal-archive-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-indigo-400" />
          <span>Settings & AI Configuration</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure your AI providers, manage knowledge categories, and backup personal archive data.
        </p>
      </div>

      {/* Profile & AI Keys Form */}
      <form
        onSubmit={handleSaveProfileAndAI}
        className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AI Engine & Personal Profile</h3>
            <p className="text-xs text-slate-400">
              Configure Google Gemini API key or continue with zero-setup heuristic fallback.
            </p>
          </div>
        </div>

        {userSaved && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">User Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Email</label>
            <input
              type="email"
              disabled
              value={user?.email || 'demo@archive.ai'}
              className="w-full bg-slate-950/50 border border-slate-800 text-slate-500 rounded-xl px-3.5 py-2.5 text-xs outline-none cursor-not-allowed"
            />
          </div>
        </div>

        {/* AI Key input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span>Google Gemini API Key (Optional)</span>
          </label>
          <input
            type="password"
            value={customApiKey}
            onChange={(e) => setCustomApiKey(e.target.value)}
            placeholder="AIzaSy... (Leave empty to use built-in offline NLP fallback)"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
          />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            💡 If no API key is provided, the system uses our <strong>Heuristic Offline Intelligence Engine</strong> for auto-categorization, entity extraction, and vector ranking with 100% availability.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={savingUser}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingUser ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Category Manager */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Custom Knowledge Categories</h3>
              <p className="text-xs text-slate-400">Manage categories used for organizing archive records.</p>
            </div>
          </div>
        </div>

        {/* New category input */}
        <form onSubmit={handleCreateCategory} className="flex gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="New Category Name (e.g. Health & Medical Records)"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
          />
          <input
            type="color"
            value={newCatColor}
            onChange={(e) => setNewCatColor(e.target.value)}
            className="w-10 h-9 rounded-xl bg-slate-950 border border-slate-800 p-1 cursor-pointer"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </form>

        {/* Existing Categories list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-xs font-semibold text-slate-200 truncate">{c.name}</span>
              </div>
              <button
                onClick={() => handleDeleteCategory(c.id)}
                title="Delete Category"
                className="p-1 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* System Actions & Data Export */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
          Archive Backup & Maintenance
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export Archive (JSON)</span>
          </button>

          <button
            onClick={handleSeedData}
            disabled={isSeeding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Resetting Data...' : 'Reset to Rich Demo Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
