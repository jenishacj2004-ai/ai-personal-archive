'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  UploadCloud,
  Menu,
  Sparkles,
  LogOut,
  User,
  ShieldCheck,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';
import { UserSession } from '@/types';

interface HeaderProps {
  onMenuToggle?: () => void;
  onOpenSearch?: () => void;
  currentUser?: UserSession | null;
}

export default function Header({ onMenuToggle, onOpenSearch, currentUser }: HeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      const res = await fetch('/api/system/seed', { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error('Failed to seed:', e);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-950/80 dark:bg-[#090d16]/80 backdrop-blur-xl border-b border-slate-800/80 px-4 md:px-8 flex items-center justify-between">
      {/* Mobile Menu & Search Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 md:hidden transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenSearch}
          className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-slate-200 transition-all text-xs md:text-sm w-48 sm:w-72 lg:w-96 shadow-sm group"
        >
          <Search className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="truncate">Search records, certificates, skills...</span>
          <kbd className="hidden sm:inline-block ml-auto text-[10px] bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-400 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sample Data Seeder Button */}
        <button
          onClick={handleSeedData}
          disabled={isSeeding}
          title="Reload Rich Demo Archive Data"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSeeding ? 'animate-spin' : ''}`} />
          <span>{isSeeding ? 'Seeding...' : 'Reset Demo Data'}</span>
        </button>

        {/* Upload Action Button */}
        <Link
          href="/archive/upload"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs sm:text-sm font-semibold shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden sm:inline">Upload Item</span>
        </Link>

        {/* User Profile / Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
              {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden md:inline text-xs font-medium text-slate-200 pr-1">
              {currentUser?.fullName?.split(' ')[0] || 'User'}
            </span>
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              onClick={() => setShowUserMenu(false)}
            >
              <div className="px-4 py-2 border-b border-slate-800/80">
                <p className="text-xs font-semibold text-white">{currentUser?.fullName || 'Alex Morgan'}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser?.email || 'demo@archive.ai'}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/settings"
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>API Keys & Preferences</span>
                </Link>
                <Link
                  href="/search"
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Knowledge Assistant</span>
                </Link>
              </div>

              <div className="border-t border-slate-800/80 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
