'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Award,
  FolderGit2,
  Trophy,
  StickyNote,
  FileText,
  UploadCloud,
  Database,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  CheckCircle2,
  Calendar,
  Star,
  Zap,
} from 'lucide-react';
import { ArchiveItemDTO, DashboardStats } from '@/types';
import ItemCard from '@/components/archive/ItemCard';
import ItemDetailModal from '@/components/archive/ItemDetailModal';
import EditItemModal from '@/components/archive/EditItemModal';
import DeleteConfirmModal from '@/components/archive/DeleteConfirmModal';
import { formatBytes, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  // Modals state
  const [viewItem, setViewItem] = useState<ArchiveItemDTO | null>(null);
  const [editItem, setEditItem] = useState<ArchiveItemDTO | null>(null);
  const [deleteItem, setDeleteItem] = useState<ArchiveItemDTO | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, catRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch('/api/categories'),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
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
    fetchDashboardData();
  }, []);

  const handleToggleFavorite = async (item: ArchiveItemDTO) => {
    try {
      await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !item.isFavorite }),
      });
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEdit = async (updatedData: any) => {
    if (!editItem) return;
    try {
      const res = await fetch(`/api/items/${editItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDelete = async (item: ArchiveItemDTO) => {
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Autonomous Knowledge Indexer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Personal Knowledge & Credential Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your centralized digital repository for certificates, software architectures, awards, and notes with automated AI categorization and vector search.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/archive/upload"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload New Item</span>
            </Link>
            <Link
              href="/search"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Ask AI Search</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Records */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Total Records</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats?.totalItems ?? '...'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across 6 semantic domains</p>
        </div>

        {/* AI Summaries Extracted */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">AI Insights</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats?.aiInsightsCount ?? '...'}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% Vectorized
          </p>
        </div>

        {/* Verified Skills */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Extracted Skills</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats?.topSkills ? stats.topSkills.length : '...'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">From credentials & projects</p>
        </div>

        {/* Storage Capacity */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Vault Storage</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {formatBytes(stats?.totalStorageBytes || 1280000)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Local encrypted disk</p>
        </div>
      </div>

      {/* Quick Category / Type Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <Link
          href="/certificates"
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Certificates</span>
            <span className="text-[11px] text-slate-400">{stats?.totalCertificates || 0} items</span>
          </div>
        </Link>

        <Link
          href="/projects"
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Projects</span>
            <span className="text-[11px] text-slate-400">{stats?.totalProjects || 0} items</span>
          </div>
        </Link>

        <Link
          href="/achievements"
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Achievements</span>
            <span className="text-[11px] text-slate-400">{stats?.totalAchievements || 0} items</span>
          </div>
        </Link>

        <Link
          href="/notes"
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-900 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <StickyNote className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Smart Notes</span>
            <span className="text-[11px] text-slate-400">{stats?.totalNotes || 0} items</span>
          </div>
        </Link>

        <Link
          href="/archive"
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Documents</span>
            <span className="text-[11px] text-slate-400">{stats?.totalDocuments || 0} items</span>
          </div>
        </Link>
      </div>

      {/* Main 2-column layout: Recent Items & Analytics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Records */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Recent Archive Records</h2>
              <p className="text-xs text-slate-400">Indexed documents, certificates & projects</p>
            </div>
            <Link
              href="/archive"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>View Explorer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : stats?.recentUploads && stats.recentUploads.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.recentUploads.slice(0, 4).map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onView={(it) => setViewItem(it)}
                  onEdit={(it) => setEditItem(it)}
                  onDelete={(it) => setDeleteItem(it)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-slate-800">
              <p className="text-xs text-slate-400">No items found in your archive yet.</p>
            </div>
          )}
        </div>

        {/* Right 1 Col: Skills Matrix & Live Activity Stream */}
        <div className="space-y-6">
          {/* Top Skills Matrix */}
          <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Extracted Skills Cloud</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Verified</span>
            </div>

            {stats?.topSkills && stats.topSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {stats.topSkills.map((sk) => (
                  <span
                    key={sk.skill}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-medium hover:border-indigo-500/40 transition-colors"
                  >
                    <span>{sk.skill}</span>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded font-bold">
                      {sk.count}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Skills will appear as you upload credentials.</p>
            )}
          </div>

          {/* Activity Stream */}
          <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Vault Activity Stream</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Realtime</span>
            </div>

            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                {stats.recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start gap-2.5 text-xs p-2 rounded-xl bg-slate-950/60 border border-slate-800/60"
                  >
                    <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-xs font-medium truncate">{act.details}</p>
                      <p className="text-[10px] text-slate-500">{formatDate(act.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No activity recorded yet.</p>
            )}
          </div>
        </div>
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
        onRefresh={fetchDashboardData}
      />

      <EditItemModal
        item={editItem}
        categories={categories}
        onClose={() => setEditItem(null)}
        onSave={handleSaveEdit}
      />

      <DeleteConfirmModal
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
