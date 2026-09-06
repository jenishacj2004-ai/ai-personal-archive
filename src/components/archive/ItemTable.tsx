'use client';

import React from 'react';
import {
  Award,
  FolderGit2,
  Trophy,
  StickyNote,
  FileText,
  Star,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { ArchiveItemDTO } from '@/types';
import { formatDate, formatBytes, getItemTypeColor } from '@/lib/utils';

interface ItemTableProps {
  items: ArchiveItemDTO[];
  onView: (item: ArchiveItemDTO) => void;
  onEdit: (item: ArchiveItemDTO) => void;
  onDelete: (item: ArchiveItemDTO) => void;
  onToggleFavorite?: (item: ArchiveItemDTO) => void;
}

export default function ItemTable({
  items,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
}: ItemTableProps) {
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);

  const getItemIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'CERTIFICATE':
        return <Award className="w-3.5 h-3.5 text-emerald-400" />;
      case 'PROJECT':
        return <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />;
      case 'ACHIEVEMENT':
        return <Trophy className="w-3.5 h-3.5 text-amber-400" />;
      case 'NOTE':
        return <StickyNote className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
        <p className="text-sm text-slate-400">No archive records found matching filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
          <tr>
            <th className="py-3.5 px-4 w-10 text-center">Fav</th>
            <th className="py-3.5 px-4">Title & Item Type</th>
            <th className="py-3.5 px-4 hidden md:table-cell">Category</th>
            <th className="py-3.5 px-4 hidden lg:table-cell">Key Skills / Tags</th>
            <th className="py-3.5 px-4 hidden sm:table-cell">Date Occurred</th>
            <th className="py-3.5 px-4 hidden sm:table-cell">Size</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {items.map((item) => {
            const typeStyle = getItemTypeColor(item.itemType);
            let skills: string[] = [];
            try {
              if (item.certificateMeta?.skills) skills = JSON.parse(item.certificateMeta.skills as any);
              if (item.projectMeta?.techStack) skills = JSON.parse(item.projectMeta.techStack as any);
            } catch {}

            return (
              <tr
                key={item.id}
                onClick={() => onView(item)}
                className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                {/* Favorite */}
                <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleFavorite?.(item)}
                    className={`p-1 rounded transition-colors ${
                      item.isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                  </button>
                </td>

                {/* Title & Type */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`p-1.5 rounded-lg border flex-shrink-0 ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                    >
                      {getItemIcon(item.itemType)}
                    </span>
                    <div className="max-w-[260px] sm:max-w-xs md:max-w-sm truncate">
                      <div className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.aiSummary || item.description || 'No description'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="py-3 px-4 hidden md:table-cell">
                  {item.category ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                      {item.category.name}
                    </span>
                  ) : (
                    <span className="text-slate-600 text-[11px]">Uncategorized</span>
                  )}
                </td>

                {/* Skills / Tags */}
                <td className="py-3 px-4 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {skills.slice(0, 2).map((sk) => (
                      <span
                        key={sk}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {sk}
                      </span>
                    ))}
                    {item.tags?.slice(0, 2).map((t) => (
                      <span
                        key={t.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-500/20"
                      >
                        #{t.tag.name}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Date */}
                <td className="py-3 px-4 hidden sm:table-cell text-slate-400 text-[11px]">
                  {formatDate(item.dateOccurred || item.createdAt)}
                </td>

                {/* Size */}
                <td className="py-3 px-4 hidden sm:table-cell text-slate-500 text-[11px]">
                  {formatBytes(item.fileSize)}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-block text-left">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === item.id ? null : item.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {menuOpenId === item.id && (
                      <div
                        className="absolute right-0 mt-1 w-32 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl py-1 z-30 text-xs animate-in fade-in"
                        onClick={() => setMenuOpenId(null)}
                      >
                        <button
                          onClick={() => onView(item)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-400 hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
