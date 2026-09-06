'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Tag as TagIcon,
  Award,
  FolderGit2,
  Trophy,
  StickyNote,
  FileText,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { ArchiveItemDTO, CategoryDTO, ItemType } from '@/types';

interface EditItemModalProps {
  item: ArchiveItemDTO | null;
  categories: CategoryDTO[];
  onClose: () => void;
  onSave: (updatedItem: Partial<ArchiveItemDTO> & { specializedData?: any }) => Promise<void>;
}

export default function EditItemModal({
  item,
  categories,
  onClose,
  onSave,
}: EditItemModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemType, setItemType] = useState<ItemType>('DOCUMENT');
  const [categoryId, setCategoryId] = useState('');
  const [importanceLevel, setImportanceLevel] = useState(3);
  const [dateOccurred, setDateOccurred] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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

  useEffect(() => {
    if (!item) return;
    setTitle(item.title || '');
    setDescription(item.description || '');
    setItemType(item.itemType);
    setCategoryId(item.categoryId || '');
    setImportanceLevel(item.importanceLevel || 3);
    setDateOccurred(item.dateOccurred ? new Date(item.dateOccurred).toISOString().slice(0, 10) : '');
    setAiSummary(item.aiSummary || '');

    const currentTags = (item.tags || []).map((t) => t.tag.name);
    setTags(currentTags);

    if (item.certificateMeta) {
      setIssuer(item.certificateMeta.issuer || '');
      setCredentialId(item.certificateMeta.credentialId || '');
      setCredentialUrl(item.certificateMeta.credentialUrl || '');
      const sk = Array.isArray(item.certificateMeta.skills)
        ? item.certificateMeta.skills
        : JSON.parse((item.certificateMeta.skills as any) || '[]');
      setSkillsInput(sk.join(', '));
    }

    if (item.projectMeta) {
      setRole(item.projectMeta.role || '');
      setRepositoryUrl(item.projectMeta.repositoryUrl || '');
      setLiveDemoUrl(item.projectMeta.liveDemoUrl || '');
      const ts = Array.isArray(item.projectMeta.techStack)
        ? item.projectMeta.techStack
        : JSON.parse((item.projectMeta.techStack as any) || '[]');
      setTechStackInput(ts.join(', '));
    }

    if (item.achievementMeta) {
      setOrganization(item.achievementMeta.organization || '');
      setAwardRank(item.achievementMeta.awardRank || '');
    }

    if (item.noteMeta) {
      setMarkdownContent(item.noteMeta.markdownContent || '');
    }
  }, [item]);

  if (!item) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

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
        specializedData.markdownContent = markdownContent;
      }

      await onSave({
        title,
        description,
        itemType,
        categoryId: categoryId || undefined,
        importanceLevel,
        dateOccurred: dateOccurred ? new Date(dateOccurred).toISOString() : undefined,
        aiSummary,
        tags: tags as any,
        specializedData,
      });

      onClose();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="text-lg font-bold text-white">Edit Archive Record</h3>
            <p className="text-xs text-slate-400">Update title, category, metadata, and AI fields.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Record Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Type & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Item Type</label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as ItemType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="DOCUMENT">Document / File</option>
                <option value="CERTIFICATE">Certificate</option>
                <option value="PROJECT">Project / Repo</option>
                <option value="ACHIEVEMENT">Achievement / Award</option>
                <option value="NOTE">Smart Note</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Occurred & Importance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date Occurred</label>
              <input
                type="date"
                value={dateOccurred}
                onChange={(e) => setDateOccurred(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Importance Level (1-5)
              </label>
              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setImportanceLevel(lvl)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      importanceLevel === lvl
                        ? 'bg-indigo-600 text-white shadow-glow'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
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
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add personal notes or context..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          {/* AI Summary */}
          <div>
            <label className="block text-xs font-semibold text-indigo-400 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Executive Summary</span>
            </label>
            <textarea
              rows={2}
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              className="w-full bg-slate-950 border border-indigo-500/30 rounded-xl p-3 text-xs text-slate-200 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          {/* Tags Cloud Editor */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tags (Press Enter to add)
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950 border border-slate-800 rounded-xl">
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

          {/* Specialized Item Sections */}
          {itemType === 'CERTIFICATE' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Certificate Specifics
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Issuer Name</label>
                  <input
                    type="text"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Credential ID</label>
                  <input
                    type="text"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="AWS, Python, React"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>
            </div>
          )}

          {itemType === 'PROJECT' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Project Specifics
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Role / Responsibility</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tech Stack (comma separated)</label>
                  <input
                    type="text"
                    value={techStackInput}
                    onChange={(e) => setTechStackInput(e.target.value)}
                    placeholder="Next.js, TypeScript, PostgreSQL"
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Live Demo URL</label>
                  <input
                    type="url"
                    value={liveDemoUrl}
                    onChange={(e) => setLiveDemoUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {itemType === 'ACHIEVEMENT' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Achievement Specifics
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Organization / Host</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Award Rank / Title</label>
                  <input
                    type="text"
                    value={awardRank}
                    onChange={(e) => setAwardRank(e.target.value)}
                    placeholder="1st Place, Gold Medal"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {itemType === 'NOTE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Markdown Note Content
              </label>
              <textarea
                rows={5}
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:border-indigo-500 outline-none"
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
