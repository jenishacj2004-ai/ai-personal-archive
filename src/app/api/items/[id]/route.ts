import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { deleteUploadedFile } from '@/lib/file-parser';
import { generateDocumentEmbedding } from '@/lib/ai-service';

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

    const item = await prisma.archiveItem.findFirst({
      where: { id, userId: user.id },
      include: {
        category: true,
        tags: { include: { tag: true } },
        certificateMeta: true,
        projectMeta: true,
        achievementMeta: true,
        noteMeta: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error fetching item detail:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.archiveItem.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const {
      title,
      description,
      categoryId,
      itemType,
      importanceLevel,
      isFavorite,
      isArchived,
      dateOccurred,
      aiSummary,
      tags,
      specializedData,
    } = body;

    // Update base fields
    const updatedItem = await prisma.archiveItem.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        itemType: itemType !== undefined ? itemType.toUpperCase() : undefined,
        importanceLevel: importanceLevel !== undefined ? importanceLevel : undefined,
        isFavorite: isFavorite !== undefined ? isFavorite : undefined,
        isArchived: isArchived !== undefined ? isArchived : undefined,
        dateOccurred: dateOccurred ? new Date(dateOccurred) : undefined,
        aiSummary: aiSummary !== undefined ? aiSummary : undefined,
      },
    });

    // Update tags if provided
    if (Array.isArray(tags)) {
      // Clear old relations
      await prisma.itemTag.deleteMany({ where: { itemId: id } });

      for (const tName of tags) {
        if (!tName || typeof tName !== 'string') continue;
        const cleanName = tName.trim();
        if (!cleanName) continue;

        let tag = await prisma.tag.findFirst({
          where: { userId: user.id, name: cleanName },
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              userId: user.id,
              name: cleanName,
            },
          });
        }

        await prisma.itemTag.create({
          data: {
            itemId: id,
            tagId: tag.id,
          },
        });
      }
    }

    // Update specialized metadata
    if (specializedData) {
      const type = itemType || existing.itemType;
      if (type === 'CERTIFICATE') {
        await prisma.certificateMeta.upsert({
          where: { itemId: id },
          create: {
            itemId: id,
            issuer: specializedData.issuer || 'Issuer',
            credentialId: specializedData.credentialId,
            credentialUrl: specializedData.credentialUrl,
            issueDate: specializedData.issueDate ? new Date(specializedData.issueDate) : null,
            expiryDate: specializedData.expiryDate ? new Date(specializedData.expiryDate) : null,
            skills: JSON.stringify(specializedData.skills || []),
            doesExpire: !!specializedData.expiryDate,
          },
          update: {
            issuer: specializedData.issuer !== undefined ? specializedData.issuer : undefined,
            credentialId: specializedData.credentialId !== undefined ? specializedData.credentialId : undefined,
            credentialUrl: specializedData.credentialUrl !== undefined ? specializedData.credentialUrl : undefined,
            issueDate: specializedData.issueDate ? new Date(specializedData.issueDate) : undefined,
            expiryDate: specializedData.expiryDate ? new Date(specializedData.expiryDate) : undefined,
            skills: specializedData.skills ? JSON.stringify(specializedData.skills) : undefined,
            doesExpire: specializedData.expiryDate !== undefined ? !!specializedData.expiryDate : undefined,
          },
        });
      } else if (type === 'PROJECT') {
        await prisma.projectMeta.upsert({
          where: { itemId: id },
          create: {
            itemId: id,
            role: specializedData.role,
            repositoryUrl: specializedData.repositoryUrl,
            liveDemoUrl: specializedData.liveDemoUrl,
            techStack: JSON.stringify(specializedData.techStack || []),
            deliverables: JSON.stringify(specializedData.deliverables || []),
            startDate: specializedData.startDate ? new Date(specializedData.startDate) : null,
            endDate: specializedData.endDate ? new Date(specializedData.endDate) : null,
          },
          update: {
            role: specializedData.role !== undefined ? specializedData.role : undefined,
            repositoryUrl: specializedData.repositoryUrl !== undefined ? specializedData.repositoryUrl : undefined,
            liveDemoUrl: specializedData.liveDemoUrl !== undefined ? specializedData.liveDemoUrl : undefined,
            techStack: specializedData.techStack ? JSON.stringify(specializedData.techStack) : undefined,
            deliverables: specializedData.deliverables ? JSON.stringify(specializedData.deliverables) : undefined,
            startDate: specializedData.startDate ? new Date(specializedData.startDate) : undefined,
            endDate: specializedData.endDate ? new Date(specializedData.endDate) : undefined,
          },
        });
      } else if (type === 'ACHIEVEMENT') {
        await prisma.achievementMeta.upsert({
          where: { itemId: id },
          create: {
            itemId: id,
            organization: specializedData.organization,
            awardRank: specializedData.awardRank,
            awardDate: specializedData.awardDate ? new Date(specializedData.awardDate) : null,
            verificationProofUrl: specializedData.verificationProofUrl,
          },
          update: {
            organization: specializedData.organization !== undefined ? specializedData.organization : undefined,
            awardRank: specializedData.awardRank !== undefined ? specializedData.awardRank : undefined,
            awardDate: specializedData.awardDate ? new Date(specializedData.awardDate) : undefined,
            verificationProofUrl: specializedData.verificationProofUrl !== undefined ? specializedData.verificationProofUrl : undefined,
          },
        });
      } else if (type === 'NOTE') {
        await prisma.noteMeta.upsert({
          where: { itemId: id },
          create: {
            itemId: id,
            markdownContent: specializedData.markdownContent || '',
            checklist: specializedData.checklist ? JSON.stringify(specializedData.checklist) : null,
          },
          update: {
            markdownContent: specializedData.markdownContent !== undefined ? specializedData.markdownContent : undefined,
            checklist: specializedData.checklist !== undefined ? JSON.stringify(specializedData.checklist) : undefined,
          },
        });
      }
    }

    // Refresh vector embedding
    const userRec = await prisma.user.findUnique({ where: { id: user.id } });
    const fullText = `${title || existing.title} ${description || existing.description || ''} ${aiSummary || existing.aiSummary || ''}`.trim();
    const vector = await generateDocumentEmbedding(fullText, userRec?.customApiKey);
    await prisma.embeddingCache.upsert({
      where: { itemId: id },
      create: {
        itemId: id,
        vectorData: JSON.stringify(vector),
        modelVersion: 'v1',
      },
      update: {
        vectorData: JSON.stringify(vector),
        modelVersion: 'v1',
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'UPDATED',
        entityType: existing.itemType,
        entityId: id,
        details: `Updated archive item "${title || existing.title}"`,
      },
    });

    const fullItem = await prisma.archiveItem.findUnique({
      where: { id },
      include: {
        category: true,
        tags: { include: { tag: true } },
        certificateMeta: true,
        projectMeta: true,
        achievementMeta: true,
        noteMeta: true,
      },
    });

    return NextResponse.json({ item: fullItem });
  } catch (error) {
    console.error('Error updating archive item:', error);
    return NextResponse.json({ error: 'Failed to update archive item' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.archiveItem.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Delete stored file if local
    if (existing.fileUrl) {
      await deleteUploadedFile(existing.fileUrl);
    }

    // Delete database item (cascades tags and meta)
    await prisma.archiveItem.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'DELETED',
        entityType: existing.itemType,
        entityId: id,
        details: `Deleted archive item "${existing.title}"`,
      },
    });

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting archive item:', error);
    return NextResponse.json({ error: 'Failed to delete archive item' }, { status: 500 });
  }
}
