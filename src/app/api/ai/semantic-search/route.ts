import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateDocumentEmbedding } from '@/lib/ai-service';
import { rankItemsByQuery } from '@/lib/vector-search';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const userRec = await prisma.user.findUnique({ where: { id: user.id } });
    const queryVector = await generateDocumentEmbedding(query.trim(), userRec?.customApiKey);

    const allItems = await prisma.archiveItem.findMany({
      where: { userId: user.id, isArchived: false },
      include: {
        category: true,
        tags: { include: { tag: true } },
        certificateMeta: true,
        projectMeta: true,
        achievementMeta: true,
        noteMeta: true,
        embeddingCache: true,
      },
    });

    const ranked = rankItemsByQuery(query.trim(), allItems as any, queryVector);

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'SEARCHED',
        entityType: 'SEMANTIC_SEARCH',
        details: `Searched for: "${query.trim().slice(0, 100)}"`,
      },
    });

    return NextResponse.json({
      query: query.trim(),
      totalMatches: ranked.length,
      results: ranked.map(r => ({
        item: r.item,
        score: r.score,
        matchReason: r.matchReason,
      })),
    });
  } catch (error) {
    console.error('Error executing semantic search:', error);
    return NextResponse.json({ error: 'Semantic search failed' }, { status: 500 });
  }
}
