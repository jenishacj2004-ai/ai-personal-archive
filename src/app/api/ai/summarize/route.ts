import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { analyzeDocumentContent } from '@/lib/ai-service';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, text } = await req.json();

    if (!itemId && !text) {
      return NextResponse.json({ error: 'itemId or text is required' }, { status: 400 });
    }

    let contentToSummarize = text;
    let fileName = 'Document';
    let itemType = 'DOCUMENT';

    if (itemId) {
      const item = await prisma.archiveItem.findFirst({
        where: { id: itemId, userId: user.id },
      });
      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      contentToSummarize = `${item.title}\n${item.description || ''}\n${item.rawTextContent || ''}`;
      fileName = item.fileName || item.title;
      itemType = item.itemType;
    }

    const userRec = await prisma.user.findUnique({ where: { id: user.id } });
    const analysis = await analyzeDocumentContent(contentToSummarize, fileName, itemType, userRec?.customApiKey);

    if (itemId) {
      await prisma.archiveItem.update({
        where: { id: itemId },
        data: {
          aiSummary: analysis.summary,
        },
      });
    }

    return NextResponse.json({
      summary: analysis.summary,
      keyPoints: analysis.keyPoints,
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
