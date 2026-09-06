import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes?: number | null, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

export function formatRelativeTime(dateStr?: string | Date | null): string {
  if (!dateStr) return 'Recently';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(d);
  } catch {
    return 'Recently';
  }
}

export function getItemTypeColor(type: string): { bg: string; text: string; border: string; glow: string } {
  switch (type?.toUpperCase()) {
    case 'CERTIFICATE':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]',
      };
    case 'PROJECT':
      return {
        bg: 'bg-indigo-500/10 dark:bg-indigo-950/40',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-500/30',
        glow: 'shadow-[0_0_15px_rgba(99,102,241,0.25)]',
      };
    case 'ACHIEVEMENT':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-950/40',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/30',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
      };
    case 'NOTE':
      return {
        bg: 'bg-purple-500/10 dark:bg-purple-950/40',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500/30',
        glow: 'shadow-[0_0_15px_rgba(168,85,247,0.25)]',
      };
    default:
      return {
        bg: 'bg-cyan-500/10 dark:bg-cyan-950/40',
        text: 'text-cyan-600 dark:text-cyan-400',
        border: 'border-cyan-500/30',
        glow: 'shadow-[0_0_15px_rgba(6,182,212,0.25)]',
      };
  }
}
