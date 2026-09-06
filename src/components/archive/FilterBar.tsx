'use client';

import React from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  SlidersHorizontal,
  X,
  Award,
  FolderGit2,
  Trophy,
  StickyNote,
  FileText,
  Layers,
} from 'lucide-react';
import { CategoryDTO, TagDTO } from '@/types';

interface FilterBarProps {
  activeType: string;
  onTypeChange: (type: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (catId: string) => void;
  selectedTag: string;
  onTagChange: (tagId: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  categories: CategoryDTO[];
  tags: TagDTO[];
  totalResults: number;
}

const typeTabs = [
  { id: 'ALL', label: 'All Items', icon: Layers },
  { id: 'DOCUMENT', label: 'Documents', icon: FileText },
  { id: 'CERTIFICATE', label: 'Certificates', icon: Award },
  { id: 'PROJECT', label: 'Projects', icon: FolderGit2 },
  { id: 'ACHIEVEMENT', label: 'Achievements', icon: Trophy },
  { id: 'NOTE', label: 'Notes', icon: StickyNote },
];

export default function FilterBar({
  activeType,
  onTypeChange,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTag,
  onTagChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  categories,
  tags,
  totalResults,
}: FilterBarProps) {
  const hasActiveFilters =
    searchQuery || selectedCategory !== 'ALL' || selectedTag !== 'ALL' || activeType !== 'ALL';

  const clearFilters = () => {
    onSearchChange('');
    onCategoryChange('ALL');
    onTagChange('ALL');
    onTypeChange('ALL');
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Type Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {typeTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTypeChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-glow'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl backdrop-blur-md">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter by title, keywords, extracted text..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns & View toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Tags Dropdown */}
          {tags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => onTagChange(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.name}
                </option>
              ))}
            </select>
          )}

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="createdAt">Newest First</option>
            <option value="dateOccurred">Date Occurred</option>
            <option value="importance">Importance Level</option>
            <option value="title">Alphabetical (A-Z)</option>
          </select>

          {/* Clear Filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3 text-rose-400" />
              <span>Reset</span>
            </button>
          )}

          {/* Grid vs Table view toggle */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-0.5 ml-auto md:ml-0">
            <button
              onClick={() => onViewModeChange('grid')}
              title="Grid View"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              title="Table View"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results counter */}
      <div className="flex justify-between items-center px-1 text-xs text-slate-400">
        <span>
          Showing <strong className="text-slate-200">{totalResults}</strong> archive {totalResults === 1 ? 'record' : 'records'}
        </span>
      </div>
    </div>
  );
}
