'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Archive,
  UploadCloud,
  Plus,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ArchiveItemDTO, CategoryDTO, TagDTO } from '@/types';
import FilterBar from '@/components/archive/FilterBar';
import ItemCard from '@/components/archive/ItemCard';
import ItemTable from '@/components/archive/ItemTable';
import ItemDetailModal from '@/components/archive/ItemDetailModal';
import EditItemModal from '@/components/archive/EditItemModal';
import DeleteConfirmModal from '@/components/archive/DeleteConfirmModal';

export default function ArchiveExplorerPage() {
  const [items, setItems] = useState<ArchiveItemDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [activeType, setActiveType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals State
  const [viewItem, setViewItem] = useState<ArchiveItemDTO | null>(null);
  const [editItem, setEditItem] = useState<ArchiveItemDTO | null>(null);
  const [deleteItem, setDeleteItem] = useState<ArchiveItemDTO | null>(null);

  const fetchFilters = async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/tags'),
      ]);
      if (catRes.ok) {
        const cData = await catRes.json();
        setCategories(cData.categories || []);
      }
      if (tagRes.ok) {
        const tData = await tagRes.json();
        setTags(tData.tags || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeType !== 'ALL') params.append('type', activeType);
      if (selectedCategory !== 'ALL') params.append('categoryId', selectedCategory);
      if (selectedTag !== 'ALL') params.append('tagId', selectedTag);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (sortBy) params.append('sortBy', sortBy);

      const res = await fetch(`/api/items?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [activeType, selectedCategory, selectedTag, searchQuery, sortBy]);

  const handleToggleFavorite = async (item: ArchiveItemDTO) => {
    try {
      await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !item.isFavorite }),
      });
      fetchItems();
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
        fetchItems();
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
        fetchItems();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Archive className="w-7 h-7 text-indigo-400" />
            <span>Archive Explorer</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse, filter, edit, and organize all stored documents and records.
          </p>
        </div>

        <Link
          href="/archive/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Archive Item</span>
        </Link>
      </div>

      {/* Filter and Control Navigation */}
      <FilterBar
        activeType={activeType}
        onTypeChange={setActiveType}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        categories={categories}
        tags={tags}
        totalResults={items.length}
      />

      {/* Items View (Grid or Table) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 rounded-3xl bg-slate-900/50 border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Archive Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Try clearing your active search filters, or upload a document to get started.
            </p>
          </div>
          <Link
            href="/archive/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-glow"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Item</span>
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
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
        <ItemTable
          items={items}
          onView={(it) => setViewItem(it)}
          onEdit={(it) => setEditItem(it)}
          onDelete={(it) => setDeleteItem(it)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* CRUD Modals */}
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
        onRefresh={fetchItems}
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
