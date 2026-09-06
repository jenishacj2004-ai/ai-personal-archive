'use client';

import React from 'react';
import {
  Award,
  FolderGit2,
  Trophy,
  StickyNote,
  FileText,
  Calendar,
  Star,
  Sparkles,
  ExternalLink,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react';
import { ArchiveItemDTO } from '@/types';
import { formatDate, formatBytes, getItemTypeColor } from '@/lib/utils';

interface ItemCardProps {
  item: ArchiveItemDTO;
  onView: (item: ArchiveItemDTO) => void;
  onEdit: (item: ArchiveItemDTO) => void;
  onDelete: (item: ArchiveItemDTO) => void;
  onToggleFavorite?: (item: ArchiveItemDTO) => void;
}

export default function ItemCard({
  item,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
}: ItemCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const typeStyle = getItemTypeColor(item.itemType);

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

  return (
    <div
      onClick={() => onView(item)}
      className="group relative bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer"
    >
      <div>
        {/* Top bar: Type badge, Favorite, Menu */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
            >
              {getItemIcon(item.itemType)}
              <span className="capitalize">{item.itemType.toLowerCase()}</span>
            </span>

            {item.category && (
              <span
                className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-md font-medium text-slate-400 bg-slate-800/80 border border-slate-700/50 truncate max-w-[120px]"
                title={item.category.name}
              >
                {item.category.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onToggleFavorite?.(item)}
              title={item.isFavorite ? 'Remove favorite' : 'Mark favorite'}
              className={`p-1.5 rounded-lg transition-colors ${
                item.isFavorite
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 mt-1 w-36 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl py-1 z-20 text-xs animate-in fade-in"
                  onClick={() => setShowMenu(false)}
                >
                  <button
                    onClick={() => onView(item)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => onEdit(item)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Metadata</span>
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Item</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1.5">
          {item.title}
        </h3>

        {/* AI Summary / Description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {item.aiSummary || item.description || 'No description recorded.'}
        </p>

        {/* AI Insight Badge */}
        {item.aiSummary && (
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg mb-3">
            <Sparkles className="w-3 h-3 text-indigo-400 flex-shrink-0" />
            <span className="truncate">AI summarized & entity extracted</span>
          </div>
        )}

        {/* Skills / Tech Chips */}
        {skillsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {skillsList.slice(0, 3).map((sk) => (
              <span
                key={sk}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
              >
                {sk}
              </span>
            ))}
            {skillsList.length > 3 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
                +{skillsList.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info: Date, File size, Importance */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>{formatDate(item.dateOccurred || item.createdAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          {item.fileSize && <span>{formatBytes(item.fileSize)}</span>}
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <span
                key={lvl}
                className={`w-1.5 h-1.5 rounded-full ${
                  lvl <= item.importanceLevel ? 'bg-indigo-400' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
