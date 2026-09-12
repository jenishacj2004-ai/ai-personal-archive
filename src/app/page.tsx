'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Sparkles,
  Award,
  FolderGit2,
  Trophy,
  StickyNote,
  Search,
  ShieldCheck,
  ArrowRight,
  Menu,
  X,
  Database,
  Lock,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#090d16] text-white selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090d16]/80 border-b border-slate-800/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-glow flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center group-hover:bg-transparent transition-colors">
                <Layers className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              AI Personal <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">Archive</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Features
            </Link>

            <Link
              href="#modules"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Archive Vaults
            </Link>

            <Link
              href="#about"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              About
            </Link>

            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:from-indigo-500 hover:to-cyan-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
            </Link>
          </nav>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 md:hidden transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col space-y-3">
              <Link
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-300 hover:text-white py-1"
              >
                Features
              </Link>
              <Link
                href="#modules"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-300 hover:text-white py-1"
              >
                Archive Vaults
              </Link>
              <Link
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-300 hover:text-white py-1"
              >
                About
              </Link>
            </div>
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-sm font-semibold text-white shadow-glow transition"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-indigo-300 mb-8 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Intelligent Personal Knowledge Vault</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
          Your Complete{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent">
            AI-Powered
          </span>{' '}
          Personal Archive
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-sm sm:text-lg text-slate-300 leading-relaxed">
          Centralize, index, and query your credentials, software architectures, hackathon victories,
          and study notes with automatic AI entity extraction and conversational Q&amp;A.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-8 py-4 text-sm font-bold text-white shadow-glow transition hover:from-indigo-500 hover:to-cyan-500 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/80 px-8 py-4 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-slate-800 hover:border-slate-600"
          >
            <span>Launch Dashboard</span>
          </Link>
        </div>

        {/* Quick Highlights Badge Bar */}
        <div className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <Award className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Certifications</div>
              <div className="text-[11px] text-slate-400">AWS, Meta &amp; Skills</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <FolderGit2 className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Projects</div>
              <div className="text-[11px] text-slate-400">Architectures &amp; Git</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Achievements</div>
              <div className="text-[11px] text-slate-400">Awards &amp; Fellowships</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <Search className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Semantic AI</div>
              <div className="text-[11px] text-slate-400">Vector Search &amp; Q&amp;A</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="border-t border-slate-800/80 py-20 px-6 bg-slate-950/40">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">Core Capabilities</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Engineered for Your Entire Career &amp; Learning Journey
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Autonomous indexing, structured entity extraction, and lightning-fast search in one unified vault.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Database className="w-6 h-6 text-indigo-400" />}
              title="Centralized Vault"
              description="Keep certifications, software portfolios, hackathon trophies, and notes neatly categorized."
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6 text-cyan-400" />}
              title="AI Document Ingestion"
              description="Drop PDF certificates or markdown files to automatically extract skills, issuers, and summaries."
            />
            <FeatureCard
              icon={<Search className="w-6 h-6 text-purple-400" />}
              title="Semantic Search & Q&A"
              description="Ask natural questions like 'What AWS certs do I hold?' and receive accurate instant answers."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6 text-emerald-400" />}
              title="Secure RBAC Vault"
              description="Role-based access control, cryptographic password hashing, and session authentication protect your vault."
            />
          </div>
        </div>
      </section>

      {/* Vault Modules Showcase */}
      <section id="modules" className="border-t border-slate-800/80 py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">Specialized Views</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Purpose-Built Sections for Every Record Type
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Certificates &amp; Badges</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log verification URLs, credential IDs, issue dates, and auto-extracted cloud and programming skills.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <FolderGit2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Projects &amp; Architectures</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Document tech stacks, GitHub repositories, live deployments, and key technical deliverables with ease.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 hover:border-purple-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <StickyNote className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Smart Notes &amp; Checklists</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rich markdown study guides, system design principles, and interactive actionable preparation checklists.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About & Stats */}
      <section id="about" className="border-t border-slate-800/80 py-20 px-6 bg-slate-950/40">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">About the Architecture</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Never Lose Track of What You Have Built &amp; Achieved
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              Instead of scattering achievements across multiple drives, resumes, and note-taking apps, AI Personal Archive serves as your single source of truth.
            </p>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Built with Next.js 15, TypeScript, MongoDB Atlas, Mongoose, and vector indexing for instantaneous retrieval.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-4">
              <StatItem value="100%" label="Personal Vault Ownership" />
              <StatItem value="AI" label="Intelligent Extraction" />
              <StatItem value="7+" label="Record Categories" />
              <StatItem value="⚡" label="Instant Semantic Retrieval" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="border-t border-slate-800/80 py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Build Your Personal Archive?
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Create your account in seconds and start cataloging your achievements and knowledge today.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-8 py-4 text-sm font-bold text-white shadow-glow transition hover:from-indigo-500 hover:to-cyan-500 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AI Personal Archive. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span>Organize.</span>
            <span>•</span>
            <span>Discover.</span>
            <span>•</span>
            <span>Remember.</span>
          </p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 transition-all hover:border-indigo-500/40 hover:-translate-y-1">
      <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-1">
      <div className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-xs text-slate-400 font-medium">{label}</div>
    </div>
  );
}