export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  
  const minLen = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLen; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return Math.max(0, Math.min(1, dotProduct / denominator));
}

export interface SearchableItem {
  id: string;
  title: string;
  description?: string | null;
  rawTextContent?: string | null;
  aiSummary?: string | null;
  itemType: string;
  category?: { name: string } | null;
  tags?: { tag: { name: string } }[];
  certificateMeta?: { issuer: string; skills?: string | null } | null;
  projectMeta?: { techStack?: string | null; role?: string | null } | null;
  embeddingCache?: { vectorData: string } | null;
}

export function rankItemsByQuery(
  query: string,
  items: SearchableItem[],
  queryVector?: number[]
): { item: SearchableItem; score: number; matchReason: string }[] {
  const qClean = query.toLowerCase().trim();
  const qKeywords = qClean.split(/\s+/).filter(k => k.length > 2);

  const scored = items.map(item => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Exact Title Match
    const titleLower = (item.title || '').toLowerCase();
    if (titleLower.includes(qClean)) {
      score += 0.45;
      reasons.push('Title keyword match');
    }

    // 2. Category & Item Type match
    const catLower = (item.category?.name || '').toLowerCase();
    const typeLower = (item.itemType || '').toLowerCase();
    if (catLower.includes(qClean) || typeLower.includes(qClean)) {
      score += 0.25;
      reasons.push('Category/Type match');
    }

    // 3. Tags & Skills match
    const tagNames = (item.tags || []).map(t => t.tag.name.toLowerCase());
    let skillList: string[] = [];
    try {
      if (item.certificateMeta?.skills) {
        skillList = JSON.parse(item.certificateMeta.skills);
      }
      if (item.projectMeta?.techStack) {
        skillList = [...skillList, ...JSON.parse(item.projectMeta.techStack)];
      }
    } catch {}

    const matchedSkills = skillList.filter(s => qClean.includes(s.toLowerCase()) || s.toLowerCase().includes(qClean));
    if (matchedSkills.length > 0) {
      score += 0.35;
      reasons.push(`Matched skills: ${matchedSkills.join(', ')}`);
    }

    const matchedTags = tagNames.filter(t => qClean.includes(t) || t.includes(qClean));
    if (matchedTags.length > 0) {
      score += 0.2;
      reasons.push(`Matched tags: ${matchedTags.join(', ')}`);
    }

    // 4. Keyword text search
    const fullText = `${item.description || ''} ${item.rawTextContent || ''} ${item.aiSummary || ''}`.toLowerCase();
    let keywordHits = 0;
    qKeywords.forEach(kw => {
      if (fullText.includes(kw)) keywordHits++;
    });
    if (keywordHits > 0) {
      score += Math.min(0.3, (keywordHits / Math.max(1, qKeywords.length)) * 0.3);
      reasons.push('Content text hit');
    }

    // 5. Vector Cosine Similarity
    if (queryVector && item.embeddingCache?.vectorData) {
      try {
        const itemVec = JSON.parse(item.embeddingCache.vectorData);
        const sim = cosineSimilarity(queryVector, itemVec);
        score += sim * 0.4;
        if (sim > 0.4) {
          reasons.push(`Semantic proximity (${(sim * 100).toFixed(0)}%)`);
        }
      } catch {}
    }

    const matchReason = reasons.length > 0 ? reasons.join(' • ') : 'General relevance';
    return { item, score: Number(score.toFixed(3)), matchReason };
  });

  return scored.filter(s => s.score > 0.1).sort((a, b) => b.score - a.score);
}

export function findRelatedItems(
  targetItem: SearchableItem,
  allItems: SearchableItem[],
  limit = 5
): { item: SearchableItem; score: number; relationReason: string }[] {
  const targetId = targetItem.id;
  const candidates = allItems.filter(i => i.id !== targetId);

  let targetVec: number[] | null = null;
  try {
    if (targetItem.embeddingCache?.vectorData) {
      targetVec = JSON.parse(targetItem.embeddingCache.vectorData);
    }
  } catch {}

  const targetTags = new Set((targetItem.tags || []).map(t => t.tag.name.toLowerCase()));
  let targetSkills: string[] = [];
  try {
    if (targetItem.certificateMeta?.skills) targetSkills = JSON.parse(targetItem.certificateMeta.skills);
    if (targetItem.projectMeta?.techStack) targetSkills = [...targetSkills, ...JSON.parse(targetItem.projectMeta.techStack)];
  } catch {}

  const scored = candidates.map(other => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Same Category
    if (targetItem.category?.name && other.category?.name && targetItem.category.name === other.category.name) {
      score += 0.25;
      reasons.push(`Shared category (${targetItem.category.name})`);
    }

    // 2. Shared Tags
    const otherTags = (other.tags || []).map(t => t.tag.name.toLowerCase());
    const commonTags = otherTags.filter(t => targetTags.has(t));
    if (commonTags.length > 0) {
      score += commonTags.length * 0.2;
      reasons.push(`Shared tags: ${commonTags.join(', ')}`);
    }

    // 3. Shared Skills / Tech Stack
    let otherSkills: string[] = [];
    try {
      if (other.certificateMeta?.skills) otherSkills = JSON.parse(other.certificateMeta.skills);
      if (other.projectMeta?.techStack) otherSkills = [...otherSkills, ...JSON.parse(other.projectMeta.techStack)];
    } catch {}

    const commonSkills = otherSkills.filter(s => targetSkills.includes(s));
    if (commonSkills.length > 0) {
      score += commonSkills.length * 0.25;
      reasons.push(`Common skills: ${commonSkills.join(', ')}`);
    }

    // 4. Vector Cosine Similarity
    if (targetVec && other.embeddingCache?.vectorData) {
      try {
        const otherVec = JSON.parse(other.embeddingCache.vectorData);
        const sim = cosineSimilarity(targetVec, otherVec);
        score += sim * 0.45;
        if (sim > 0.4) {
          reasons.push(`Semantic relationship (${(sim * 100).toFixed(0)}%)`);
        }
      } catch {}
    }

    const relationReason = reasons.length > 0 ? reasons.join(' • ') : 'Archive relationship';
    return { item: other, score: Number(score.toFixed(3)), relationReason };
  });

  return scored.filter(s => s.score > 0.15).sort((a, b) => b.score - a.score).slice(0, limit);
}
