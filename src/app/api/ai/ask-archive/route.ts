import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateDocumentEmbedding, askArchiveQuestion } from '@/lib/ai-service';
import { rankItemsByQuery } from '@/lib/vector-search';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question } = await req.json();

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const userRec = await prisma.user.findUnique({ where: { id: user.id } });
    const queryVector = await generateDocumentEmbedding(question.trim(), userRec?.customApiKey);

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

    const ranked = rankItemsByQuery(question.trim(), allItems as any, queryVector);
    const topMatches = ranked.slice(0, 5);

    const contextSnippets = topMatches.map(m => {
      const it = m.item;
      let extra = '';
      if (it.certificateMeta) {
        extra += ` Issuer: ${it.certificateMeta.issuer}, Skills: ${it.certificateMeta.skills || 'N/A'}`;
      }
      if (it.projectMeta) {
        extra += ` Tech Stack: ${it.projectMeta.techStack || 'N/A'}, Role: ${it.projectMeta.role || 'N/A'}`;
      }
      return `Title: ${it.title}\nType: ${it.itemType}\nSummary: ${it.aiSummary || it.description || ''}\n${extra}`.trim();
    });

    const aiAnswer = await askArchiveQuestion(question.trim(), contextSnippets, userRec?.customApiKey);

    return NextResponse.json({
      question: question.trim(),
      answer: aiAnswer.answer,
      matchedItems: topMatches.map(m => ({
        id: m.item.id,
        title: m.item.title,
        itemType: m.item.itemType,
        aiSummary: m.item.aiSummary,
      })),
    });
  } catch (error) {
    console.error('Error answering question from archive:', error);
    return NextResponse.json({ error: 'Failed to answer question' }, { status: 500 });
  }
}
