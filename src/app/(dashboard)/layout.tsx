'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import SmartSearchModal from '@/components/ai/SmartSearchModal';
import { UserSession } from '@/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchUserAndStats = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }
        const userData = await userRes.json();
        setCurrentUser(userData.user);

        const statsRes = await fetch('/api/analytics/overview');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserAndStats();

    // Global Cmd+K / Ctrl+K shortcut listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#090d16] flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        totalItems={stats?.totalItems || 5}
        storageUsedFormatted={
          stats?.totalStorageBytes
            ? `${(stats.totalStorageBytes / (1024 * 1024)).toFixed(1)} MB`
            : '1.2 MB'
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onOpenSearch={() => setSearchModalOpen(true)}
          currentUser={currentUser}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Semantic Search & AI Q&A Modal */}
      <SmartSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </div>
  );
}
