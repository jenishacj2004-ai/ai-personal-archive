'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UploadCloud, ArrowLeft, Sparkles } from 'lucide-react';
import DropzoneStudio from '@/components/upload/DropzoneStudio';
import { CategoryDTO } from '@/types';

export default function UploadPage() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCats();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/archive"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <UploadCloud className="w-7 h-7 text-indigo-400" />
            <span>AI Ingestion Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Upload certificates, documents, or projects with real-time text extraction and automated AI entity analysis.
          </p>
        </div>
      </div>

      {/* Ingestion Studio Component */}
      <DropzoneStudio categories={categories} />
    </div>
  );
}
