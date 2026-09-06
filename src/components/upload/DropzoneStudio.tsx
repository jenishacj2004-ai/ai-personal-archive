'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  ArrowRight,
  RefreshCw,
  FolderPlus,
  Calendar,
  Layers,
  Award,
  FolderGit2,
  Trophy,
  StickyNote,
} from 'lucide-react';
import { AIExtractionResult, CategoryDTO, ItemType } from '@/types';
import { formatBytes } from '@/lib/utils';

interface DropzoneStudioProps {
  categories: CategoryDTO[];
  onSuccess?: () => void;
}

export default function DropzoneStudio({ categories, onSuccess }: DropzoneStudioProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'manual'>('file');

  // Pipeline Status: 'idle' | 'extracting' | 'analyzing' | 'review' | 'saving' | 'done'
  const [pipelineStage, setPipelineStage] = useState<'idle' | 'extracting' | 'analyzing' | 'review' | 'saving' | 'done'>('idle');
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Editable fields for review step
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemType, setItemType] = useState<ItemType>('DOCUMENT');
  const [categoryId, setCategoryId] = useState('');
  const [importanceLevel, setImportanceLevel] = useState(3);
  const [dateOccurred, setDateOccurred] = useState(new Date().toISOString().slice(0, 10));
  const [aiSummary, setAiSummary] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Specialized fields
  const [issuer, setIssuer] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [skillsInput, setSkillsInput] = useState('');

  const [role, setRole] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [techStackInput, setTechStackInput] = useState('');

  const [organization, setOrganization] = useState('');
  const [awardRank, setAwardRank] = useState('');

  const [markdownContent, setMarkdownContent] = useState('');

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setErrorMessage('');
    setPipelineStage('extracting');
    setPipelineProgress(30);

    try {
      // 1. Send file for live AI analysis preview
      const formData = new FormData();
      formData.append('file', file);
      formData.append('hintType', itemType);

      setPipelineStage('analyzing');
      setPipelineProgress(65);

      const res = await fetch('/api/ai/analyze-file', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Analysis failed');
      }

      const data = await res.json();
      const analysis: AIExtractionResult = data.analysis;

      // Populate review state with AI results
      setTitle(analysis.title || file.name);
      setItemType(analysis.itemType || 'DOCUMENT');
      setAiSummary(analysis.summary || '');
      setTags(analysis.suggestedTags || []);

      // Match category
      if (analysis.suggestedCategory && categories.length > 0) {
        const foundCat = categories.find(
          (c) => c.name.toLowerCase().includes(analysis.suggestedCategory.toLowerCase()) ||
                 analysis.suggestedCategory.toLowerCase().includes(c.name.toLowerCase())
        );
        if (foundCat) setCategoryId(foundCat.id);
      }

      if (analysis.extractedEntities) {
        const ent = analysis.extractedEntities;
        if (ent.issuerOrOrg) {
          setIssuer(ent.issuerOrOrg);
          setOrganization(ent.issuerOrOrg);
        }
        if (ent.dateOccurred) setDateOccurred(ent.dateOccurred.slice(0, 10));
        if (ent.credentialId) setCredentialId(ent.credentialId);
        if (ent.skills) setSkillsInput(ent.skills.join(', '));
        if (ent.roleOrTitle) setRole(ent.roleOrTitle);
        if (ent.projectStack) setTechStackInput(ent.projectStack.join(', '));
        if (ent.awardName) setAwardRank(ent.awardName);
        if (ent.estimatedImportance) setImportanceLevel(ent.estimatedImportance);
      }

      setPipelineProgress(100);
      setPipelineStage('review');
    } catch (err: any) {
      console.error(err);
      // Fallback: fill basic details and jump to review
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
      setPipelineStage('review');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFinalSave = async () => {
    if (!title.trim()) {
      setErrorMessage('Please enter a title for the archive item');
      return;
    }

    try {
      setPipelineStage('saving');
      setErrorMessage('');

      const specializedData: any = {};
      if (itemType === 'CERTIFICATE') {
        specializedData.issuer = issuer;
        specializedData.credentialId = credentialId;
        specializedData.credentialUrl = credentialUrl;
        specializedData.skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
      } else if (itemType === 'PROJECT') {
        specializedData.role = role;
        specializedData.repositoryUrl = repositoryUrl;
        specializedData.liveDemoUrl = liveDemoUrl;
        specializedData.techStack = techStackInput.split(',').map((s) => s.trim()).filter(Boolean);
      } else if (itemType === 'ACHIEVEMENT') {
        specializedData.organization = organization;
        specializedData.awardRank = awardRank;
      } else if (itemType === 'NOTE') {
        specializedData.markdownContent = markdownContent || description;
      }

      if (selectedFile) {
        // Multipart upload
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('itemType', itemType);
        formData.append('categoryId', categoryId);
        formData.append('importanceLevel', importanceLevel.toString());
        formData.append('dateOccurred', dateOccurred);
        formData.append('tags', JSON.stringify(tags));
        formData.append('specializedData', JSON.stringify(specializedData));

        const res = await fetch('/api/items', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Failed to upload and save item');
      } else {
        // Manual JSON submission
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            itemType,
            categoryId,
            importanceLevel,
            dateOccurred,
            aiSummary,
            tags,
            specializedData,
          }),
        });

        if (!res.ok) throw new Error('Failed to save archive item');
      }

      setPipelineStage('done');
      setTimeout(() => {
        router.push('/archive');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error saving item');
      setPipelineStage('review');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Upload Mode Selector */}
      <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setUploadMode('file');
              if (pipelineStage === 'idle') setPipelineStage('idle');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              uploadMode === 'file'
                ? 'bg-indigo-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document / File</span>
          </button>

          <button
            onClick={() => {
              setUploadMode('manual');
              setPipelineStage('review');
              if (!title) setTitle('New Archive Record');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              uploadMode === 'manual'
                ? 'bg-indigo-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Manual Entry (No File)</span>
          </button>
        </div>

        {selectedFile && (
          <span className="text-xs text-indigo-400 font-mono px-3 hidden sm:inline truncate max-w-xs">
            {selectedFile.name} ({formatBytes(selectedFile.size)})
          </span>
        )}
      </div>

      {/* Pipeline Visualizer (When Processing) */}
      {(pipelineStage === 'extracting' || pipelineStage === 'analyzing' || pipelineStage === 'saving') && (
        <div className="p-8 rounded-3xl bg-slate-900 border border-indigo-500/30 text-center space-y-4 shadow-2xl animate-in fade-in">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {pipelineStage === 'extracting' && 'Extracting text and file layers...'}
              {pipelineStage === 'analyzing' && 'Running AI categorization, summarization & skills extraction...'}
              {pipelineStage === 'saving' && 'Committing record to database and caching semantic vector...'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Analyzing entities, suggesting categories, generating executive summary.
            </p>
          </div>
          <div className="w-full max-w-md mx-auto bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${pipelineProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step 1: Dropzone File Upload */}
      {uploadMode === 'file' && pipelineStage === 'idle' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-200 group ${
            isDragging
              ? 'border-indigo-500 bg-indigo-950/20 scale-[1.01]'
              : 'border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 hover:bg-slate-900/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.docx,.json,.csv"
          />

          <div className="w-16 h-16 rounded-3xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-glow">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white mb-1">
            Drag & Drop your document, certificate, or project file
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Supports PDF, Images (PNG, JPG), Markdown, Text, and Code. Our AI will automatically extract
            titles, skills, dates, and summarize content.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 group-hover:bg-indigo-600 text-xs font-semibold text-white transition-colors">
            <FileText className="w-3.5 h-3.5" />
            <span>Browse Files</span>
          </div>
        </div>
      )}

      {/* Step 2: Review & Edit Before Final Commit */}
      {pipelineStage === 'review' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Review & Confirm Archive Record</h3>
                <p className="text-xs text-slate-400">
                  AI has extracted the fields below. Edit or verify before saving.
                </p>
              </div>
            </div>

            {selectedFile && (
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPipelineStage('idle');
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Change File
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* AI Executive Summary Preview */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Generated Summary</span>
            </div>
            <textarea
              rows={2}
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              className="w-full bg-slate-950/80 border border-indigo-500/20 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          {/* Core Form Fields */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AWS Solutions Architect Certificate"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Type, Category, Date, Importance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Item Type</label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as ItemType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value="DOCUMENT">Document</option>
                  <option value="CERTIFICATE">Certificate</option>
                  <option value="PROJECT">Project</option>
                  <option value="ACHIEVEMENT">Achievement</option>
                  <option value="NOTE">Note</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date Occurred</label>
                <input
                  type="date"
                  value={dateOccurred}
                  onChange={(e) => setDateOccurred(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Importance (1-5)</label>
                <div className="flex gap-1 pt-0.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setImportanceLevel(lvl)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        importanceLevel === lvl
                          ? 'bg-indigo-600 text-white shadow-glow'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional personal notes, context, or takeaways..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:border-indigo-500 outline-none resize-none"
              />
            </div>

            {/* Tags Cloud Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tags (Press Enter to add)
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/30"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-white ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder={tags.length === 0 ? 'Type tag and press Enter...' : ''}
                  className="bg-transparent border-none text-xs text-slate-200 outline-none px-2 py-1 flex-1 min-w-[120px]"
                />
              </div>
            </div>

            {/* Type-Specific Dynamic Sections */}
            {itemType === 'CERTIFICATE' && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Certificate Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Issuer / Organization</label>
                    <input
                      type="text"
                      value={issuer}
                      onChange={(e) => setIssuer(e.target.value)}
                      placeholder="e.g. AWS, Meta, Coursera"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Credential ID</label>
                    <input
                      type="text"
                      value={credentialId}
                      onChange={(e) => setCredentialId(e.target.value)}
                      placeholder="e.g. AWS-ASA-12345"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Validated Skills (comma separated)</label>
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="AWS, Cloud Architecture, EC2, S3"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                  />
                </div>
              </div>
            )}

            {itemType === 'PROJECT' && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Project Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Role / Position</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Lead Developer, Creator"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Tech Stack (comma separated)</label>
                    <input
                      type="text"
                      value={techStackInput}
                      onChange={(e) => setTechStackInput(e.target.value)}
                      placeholder="Next.js, TypeScript, Docker"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Repository URL</label>
                    <input
                      type="url"
                      value={repositoryUrl}
                      onChange={(e) => setRepositoryUrl(e.target.value)}
                      placeholder="https://github.com/username/project"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Live Demo URL</label>
                    <input
                      type="url"
                      value={liveDemoUrl}
                      onChange={(e) => setLiveDemoUrl(e.target.value)}
                      placeholder="https://project.dev"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {itemType === 'ACHIEVEMENT' && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Achievement Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Organization / Host</label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Hackathon Host, University"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Award Rank / Honor</label>
                    <input
                      type="text"
                      value={awardRank}
                      onChange={(e) => setAwardRank(e.target.value)}
                      placeholder="1st Place Winner, Magna Cum Laude"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {itemType === 'NOTE' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Markdown Content
                </label>
                <textarea
                  rows={4}
                  value={markdownContent}
                  onChange={(e) => setMarkdownContent(e.target.value)}
                  placeholder="# Enter your markdown notes here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Confirm & Save Button */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (uploadMode === 'file') {
                  setSelectedFile(null);
                  setPipelineStage('idle');
                } else {
                  router.push('/archive');
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleFinalSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Save to Archive</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success Confirmation */}
      {pipelineStage === 'done' && (
        <div className="p-10 rounded-3xl bg-slate-900 border border-emerald-500/40 text-center space-y-3 shadow-2xl animate-in zoom-in-95">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Item Indexed Successfully!</h3>
          <p className="text-xs text-slate-400">
            "{title}" is now archived, categorized, and searchable. Redirecting to Archive Explorer...
          </p>
        </div>
      )}
    </div>
  );
}
