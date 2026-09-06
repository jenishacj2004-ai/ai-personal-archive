import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { findRelatedItems } from '@/lib/vector-search';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const target = await prisma.archiveItem.findFirst({
      where: { id, userId: user.id },
      include: {
        category: true,
        tags: { include: { tag: true } },
        certificateMeta: true,
        projectMeta: true,
        embeddingCache: true,
      },
    });

    if (!target) {
      return NextResponse.json({ error: 'Target item not found' }, { status: 404 });
    }

    const allUserItems = await prisma.archiveItem.findMany({
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

    const related = findRelatedItems(target as any, allUserItems as any, 6);

    return NextResponse.json({
      targetId: id,
      related: related.map(r => ({
        ...r.item,
        relationScore: r.score,
        relationReason: r.relationReason,
      })),
    });
  } catch (error) {
    console.error('Error finding related items:', error);
    return NextResponse.json({ error: 'Failed to find related items' }, { status: 500 });
  }
}
