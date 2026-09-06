export type ItemType = 'DOCUMENT' | 'CERTIFICATE' | 'PROJECT' | 'ACHIEVEMENT' | 'NOTE';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  aiProvider: string;
}

export interface CategoryDTO {
  id: string;
  userId: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  description?: string | null;
  isSystemDefault: boolean;
  _count?: {
    items: number;
  };
}

export interface TagDTO {
  id: string;
  userId: string;
  name: string;
  color: string;
  _count?: {
    items: number;
  };
}

export interface CertificateMetadataDTO {
  issuer: string;
  credentialId?: string;
  credentialUrl?: string;
  issueDate?: string;
  expiryDate?: string;
  skills: string[];
  doesExpire: boolean;
}

export interface ProjectMetadataDTO {
  role?: string;
  repositoryUrl?: string;
  liveDemoUrl?: string;
  techStack: string[];
  deliverables: string[];
  startDate?: string;
  endDate?: string;
}

export interface AchievementMetadataDTO {
  organization?: string;
  awardRank?: string;
  awardDate?: string;
  verificationProofUrl?: string;
}

export interface NoteMetadataDTO {
  markdownContent: string;
  checklist?: { text: string; done: boolean }[];
}

export interface ArchiveItemDTO {
  id: string;
  userId: string;
  categoryId?: string | null;
  category?: CategoryDTO | null;
  title: string;
  description?: string | null;
  itemType: ItemType;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  rawTextContent?: string | null;
  aiSummary?: string | null;
  aiExtractedKeyValues?: Record<string, any> | null;
  importanceLevel: number;
  isArchived: boolean;
  isFavorite: boolean;
  dateOccurred?: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: { id: string; tag: TagDTO }[];
  certificateMeta?: CertificateMetadataDTO | null;
  projectMeta?: ProjectMetadataDTO | null;
  achievementMeta?: AchievementMetadataDTO | null;
  noteMeta?: NoteMetadataDTO | null;
  similarityScore?: number;
}

export interface AIExtractionResult {
  title: string;
  itemType: ItemType;
  suggestedCategory: string;
  suggestedTags: string[];
  summary: string;
  keyPoints: string[];
  extractedEntities: {
    issuerOrOrg?: string;
    dateOccurred?: string;
    expiryDate?: string;
    credentialId?: string;
    skills: string[];
    roleOrTitle?: string;
    projectStack?: string[];
    keyDeliverables?: string[];
    awardName?: string;
    estimatedImportance: number;
  };
  confidence: number;
}

export interface SemanticSearchResult {
  item: ArchiveItemDTO;
  score: number;
  matchReason: string;
  snippet?: string;
}

export interface DashboardStats {
  totalItems: number;
  totalDocuments: number;
  totalCertificates: number;
  totalProjects: number;
  totalAchievements: number;
  totalNotes: number;
  totalStorageBytes: number;
  aiInsightsCount: number;
  topSkills: { skill: string; count: number }[];
  categoryBreakdown: { name: string; color: string; count: number }[];
  recentUploads: ArchiveItemDTO[];
  recentActivities: {
    id: string;
    action: string;
    entityType: string;
    details?: string;
    timestamp: string;
  }[];
}
