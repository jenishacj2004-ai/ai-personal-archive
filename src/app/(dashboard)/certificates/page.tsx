'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  UploadCloud,
  ExternalLink,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building,
  Sparkles,
} from 'lucide-react';
import { ArchiveItemDTO } from '@/types';
import ItemCard from '@/components/archive/ItemCard';
import ItemDetailModal from '@/components/archive/ItemDetailModal';
import EditItemModal from '@/components/archive/EditItemModal';
import DeleteConfirmModal from '@/components/archive/DeleteConfirmModal';
import { formatDate } from '@/lib/utils';

export default function CertificatesPage() {
  const [items, setItems] = useState<ArchiveItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  // Modals state
  const [viewItem, setViewItem] = useState<ArchiveItemDTO | null>(null);
  const [editItem, setEditItem] = useState<ArchiveItemDTO | null>(null);
  const [deleteItem, setDeleteItem] = useState<ArchiveItemDTO | null>(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const [itemRes, catRes] = await Promise.all([
        fetch('/api/items?type=CERTIFICATE'),
        fetch('/api/categories'),
      ]);

      if (itemRes.ok) {
        const data = await itemRes.json();
        setItems(data.items || []);
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
    fetchCertificates();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-emerald-400" />
            <span>Certificates & Credentials Vault</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Store, verify, and showcase professional certifications, diplomas, and validated skill badges.
          </p>
        </div>

        <Link
          href="/archive/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-glow-emerald transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Certificate</span>
        </Link>
      </div>

      {/* Grid of Certificates */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-3xl bg-slate-900/50 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Certificates Archived Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Upload AWS, Meta, Google, university, or online course credentials to extract skills automatically.
            </p>
          </div>
          <Link
            href="/archive/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-glow-emerald"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Certificate</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onView={(it) => setViewItem(it)}
              onEdit={(it) => setEditItem(it)}
              onDelete={(it) => setDeleteItem(it)}
            />
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
        onRefresh={fetchCertificates}
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
          fetchCertificates();
        }}
      />

      <DeleteConfirmModal
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={async (it) => {
          await fetch(`/api/items/${it.id}`, { method: 'DELETE' });
          fetchCertificates();
        }}
      />
    </div>
  );
}
