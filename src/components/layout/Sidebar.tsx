'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Archive,
  Award,
  FolderGit2,
  Trophy,
  StickyNote,
  Sparkles,
  Settings,
  UploadCloud,
  Layers,
  ChevronRight,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  storageUsedFormatted?: string;
  totalItems?: number;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Archive Explorer', href: '/archive', icon: Archive },
  { name: 'Upload Studio', href: '/archive/upload', icon: UploadCloud, highlight: true },
  { name: 'Certificates', href: '/certificates', icon: Award },
  { name: 'Projects', href: '/projects', icon: FolderGit2 },
  { name: 'Achievements', href: '/achievements', icon: Trophy },
  { name: 'Smart Notes', href: '/notes', icon: StickyNote },
  { name: 'AI Semantic Search', href: '/search', icon: Sparkles },
  { name: 'Settings & API', href: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen = true, onClose, storageUsedFormatted = '1.2 MB', totalItems = 5 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-slate-950/90 dark:bg-[#090d16]/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/60">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-glow flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center group-hover:bg-transparent transition-colors">
              <Layers className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
            </div>
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              AI Personal <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">Archive</span>
            </div>
            <p className="text-[11px] text-slate-400">Intelligent Digital Vault</p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition-colors"
            aria-label="Close sidebar"
          >
            <span className="text-lg leading-none">✕</span>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Core Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                'group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent',
                item.highlight && !isActive && 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-transform group-hover:scale-110 duration-200',
                    isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200',
                    item.highlight && 'text-cyan-400'
                  )}
                />
                <span>{item.name}</span>
              </div>
              {isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
              ) : item.highlight ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                  New
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Storage & System Status Widget */}
      <div className="p-4 m-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Vault Capacity</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">{storageUsedFormatted}</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
          <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full w-[24%]" />
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span>{totalItems} items indexed</span>
          <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AI Synced
          </span>
        </div>
      </div>
    </aside>
  );
}
