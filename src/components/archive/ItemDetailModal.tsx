'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  FolderGit2,
  Trophy,
  StickyNote,
  FileText,
  Calendar,
  Sparkles,
  ExternalLink,
  Download,
  Edit2,
  Trash2,
  Star,
  CheckCircle,
  RefreshCw,
  Link as LinkIcon,
  Tag,
  Building,
  CheckSquare,
} from 'lucide-react';
import { ArchiveItemDTO } from '@/types';
import { formatDate, formatBytes, getItemTypeColor } from '@/lib/utils';

interface ItemDetailModalProps {
  item: ArchiveItemDTO | null;
  onClose: () => void;
  onEdit: (item: ArchiveItemDTO) => void;
  onDelete: (item: ArchiveItemDTO) => void;
  onRefresh?: () => void;
}

export default function ItemDetailModal({
  item,
  onClose,
  onEdit,
  onDelete,
  onRefresh,
}: ItemDetailModalProps) {
  const [relatedItems, setRelatedItems] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [currentSummary, setCurrentSummary] = useState(item?.aiSummary || '');

  useEffect(() => {
    if (!item) return;
    setCurrentSummary(item.aiSummary || '');

    const fetchRelated = async () => {
      try {
        setLoadingRelated(true);
        const res = await fetch(`/api/items/${item.id}/related`);
        if (res.ok) {
          const data = await res.json();
          setRelatedItems(data.related || []);
        }
      } catch (err) {
        console.error('Error fetching related:', err);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelated();
  }, [item]);

  if (!item) return null;

  const typeStyle = getItemTypeColor(item.itemType);

  const handleRegenerateSummary = async () => {
    try {
      setIsSummarizing(true);
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSummary(data.summary);
        onRefresh?.();
      }
    } catch (e) {
      console.error('Failed to regenerate summary:', e);
    } finally {
      setIsSummarizing(false);
    }
  };

  let skillsList: string[] = [];
  try {
    if (item.certificateMeta?.skills) {
      skillsList = Array.isArray(item.certificateMeta.skills)
        ? item.certificateMeta.skills
        : JSON.parse(item.certificateMeta.skills as any);
    } else if (item.projectMeta?.techStack) {
      skillsList = Array.isArray(item.projectMeta.techStack)
        ? item.projectMeta.techStack
        : JSON.parse(item.projectMeta.techStack as any);
    }
  } catch {}

  let deliverablesList: string[] = [];
  try {
    if (item.projectMeta?.deliverables) {
      deliverablesList = Array.isArray(item.projectMeta.deliverables)
        ? item.projectMeta.deliverables
        : JSON.parse(item.projectMeta.deliverables as any);
    }
  } catch {}

  let checklistItems: { text: string; done: boolean }[] = [];
  try {
    if (item.noteMeta?.checklist) {
      checklistItems = Array.isArray(item.noteMeta.checklist)
        ? item.noteMeta.checklist
        : JSON.parse(item.noteMeta.checklist as any);
    }
  } catch {}

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/60">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
              >
                <span className="capitalize">{item.itemType.toLowerCase()}</span>
              </span>

              {item.category && (
                <span className="text-xs px-2.5 py-1 rounded-lg font-medium text-slate-300 bg-slate-800 border border-slate-700">
                  {item.category.name}
                </span>
              )}

              {item.isFavorite && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>Favorite</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{item.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(item)}
              title="Edit Item"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(item)}
              title="Delete Item"
              className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Main 2-column info */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Summary Block */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>AI Executive Summary</span>
                </div>
                <button
                  onClick={handleRegenerateSummary}
                  disabled={isSummarizing}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : ''}`} />
                  <span>{isSummarizing ? 'Analyzing...' : 'Refresh AI'}</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {currentSummary || 'No AI summary generated for this record.'}
              </p>
            </div>

            {/* Description / Content Body */}
            {item.description && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Description & Context
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  {item.description}
                </p>
              </div>
            )}

            {/* Markdown Note Content */}
            {item.noteMeta?.markdownContent && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Note Content
                </h4>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                  {item.noteMeta.markdownContent}
                </div>
              </div>
            )}

            {/* Checklist */}
            {checklistItems.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                  <span>Action Checklist</span>
                </h4>
                <div className="space-y-1.5">
                  {checklistItems.map((chk, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                    >
                      <CheckCircle
                        className={`w-4 h-4 ${chk.done ? 'text-emerald-400' : 'text-slate-600'}`}
                      />
                      <span className={chk.done ? 'text-slate-400 line-through' : 'text-slate-200'}>
                        {chk.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Details & Download */}
            {item.fileUrl && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white truncate max-w-xs">{item.fileName || 'Archive Asset'}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatBytes(item.fileSize)} • {item.fileType || 'Document'}
                    </p>
                  </div>
                </div>

                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            )}

            {/* Related Items Discovery */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  AI Contextual Relationships & Recommendations
                </h4>
              </div>

              {loadingRelated ? (
                <p className="text-xs text-slate-500 italic">Finding related archive items...</p>
              ) : relatedItems.length === 0 ? (
                <p className="text-xs text-slate-500">No strongly related items found yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {relatedItems.slice(0, 4).map((rel) => (
                    <div
                      key={rel.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/30 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                          {rel.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                          {Math.round(rel.relationScore * 100)}% Match
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{rel.relationReason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar: Extracted metadata & entity stats */}
          <div className="space-y-4">
            {/* Metadata Card */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
                Item Metadata
              </h4>

              {/* Certificate Specifics */}
              {item.certificateMeta && (
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500">Issuer:</span>
                    <p className="font-semibold text-slate-200">{item.certificateMeta.issuer}</p>
                  </div>
                  {item.certificateMeta.credentialId && (
                    <div>
                      <span className="text-slate-500">Credential ID:</span>
                      <p className="font-mono text-slate-300">{item.certificateMeta.credentialId}</p>
                    </div>
                  )}
                  {item.certificateMeta.credentialUrl && (
                    <div>
                      <a
                        href={item.certificateMeta.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Verify Credential</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Project Specifics */}
              {item.projectMeta && (
                <div className="space-y-2 text-xs">
                  {item.projectMeta.role && (
                    <div>
                      <span className="text-slate-500">Role:</span>
                      <p className="font-semibold text-slate-200">{item.projectMeta.role}</p>
                    </div>
                  )}
                  {item.projectMeta.repositoryUrl && (
                    <div>
                      <a
                        href={item.projectMeta.repositoryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-400 hover:underline"
                      >
                        <FolderGit2 className="w-3 h-3" />
                        <span>Repository Link</span>
                      </a>
                    </div>
                  )}
                  {item.projectMeta.liveDemoUrl && (
                    <div>
                      <a
                        href={item.projectMeta.liveDemoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Live Demo</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Achievement Specifics */}
              {item.achievementMeta && (
                <div className="space-y-2 text-xs">
                  {item.achievementMeta.organization && (
                    <div>
                      <span className="text-slate-500">Awarding Body:</span>
                      <p className="font-semibold text-slate-200">{item.achievementMeta.organization}</p>
                    </div>
                  )}
                  {item.achievementMeta.awardRank && (
                    <div>
                      <span className="text-slate-500">Honor / Standing:</span>
                      <p className="font-semibold text-amber-400">{item.achievementMeta.awardRank}</p>
                    </div>
                  )}
                </div>
              )}

              {/* General details */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date Logged:</span>
                  <span className="text-slate-300">{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date Occurred:</span>
                  <span className="text-slate-300">{formatDate(item.dateOccurred)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Importance:</span>
                  <span className="text-indigo-400 font-bold">{item.importanceLevel} / 5</span>
                </div>
              </div>
            </div>

            {/* Skills & Tags Cloud */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Validated Skills & Tags
              </h4>

              {skillsList.length > 0 && (
                <div className="mb-3">
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1.5">SKILLS</span>
                  <div className="flex flex-wrap gap-1.5">
                    {skillsList.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2.5 py-1 rounded-lg bg-indigo-950/50 text-indigo-300 border border-indigo-500/30 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.tags && item.tags.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1.5">TAGS</span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t) => (
                      <span
                        key={t.id}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-medium"
                      >
                        #{t.tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
