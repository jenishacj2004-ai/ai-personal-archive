import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { saveUploadedFile, extractTextFromFile } from '@/lib/file-parser';
import { analyzeDocumentContent, generateDocumentEmbedding } from '@/lib/ai-service';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const categoryId = searchParams.get('categoryId');
    const tagId = searchParams.get('tagId');
    const search = searchParams.get('search');
    const isFavorite = searchParams.get('favorite');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const whereClause: any = {
      userId: user.id,
      isArchived: false,
    };

    if (type && type !== 'ALL') {
      whereClause.itemType = type.toUpperCase();
    }

    if (categoryId && categoryId !== 'ALL') {
      whereClause.categoryId = categoryId;
    }

    if (tagId && tagId !== 'ALL') {
      whereClause.tags = {
        some: { tagId },
      };
    }

    if (isFavorite === 'true') {
      whereClause.isFavorite = true;
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { rawTextContent: { contains: q } },
        { aiSummary: { contains: q } },
      ];
    }

    const orderBy: any = {};
    if (sortBy === 'importance') {
      orderBy.importanceLevel = sortOrder;
    } else if (sortBy === 'title') {
      orderBy.title = sortOrder;
    } else if (sortBy === 'dateOccurred') {
      orderBy.dateOccurred = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const items = await prisma.archiveItem.findMany({
      where: whereClause,
      orderBy,
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        certificateMeta: true,
        projectMeta: true,
        achievementMeta: true,
        noteMeta: true,
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch archive items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    let title = '';
    let description = '';
    let itemType = 'DOCUMENT';
    let categoryId = '';
    let tagsInput: string[] = [];
    let importanceLevel = 3;
    let isFavorite = false;
    let dateOccurred: Date | null = null;
    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;
    let fileSize: number | null = null;
    let rawTextContent = '';
    let aiSummary = '';
    let aiExtractedKeyValues: Record<string, any> | null = null;
    let specializedData: any = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      title = (formData.get('title') as string) || '';
      description = (formData.get('description') as string) || '';
      itemType = ((formData.get('itemType') as string) || 'DOCUMENT').toUpperCase();
      categoryId = (formData.get('categoryId') as string) || '';
      importanceLevel = parseInt((formData.get('importanceLevel') as string) || '3', 10);
      isFavorite = formData.get('isFavorite') === 'true';

      const dateStr = formData.get('dateOccurred') as string;
      if (dateStr) dateOccurred = new Date(dateStr);

      const tagsRaw = formData.get('tags') as string;
      if (tagsRaw) {
        try {
          tagsInput = JSON.parse(tagsRaw);
        } catch {
          tagsInput = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
        }
      }

      const specRaw = formData.get('specializedData') as string;
      if (specRaw) {
        try {
          specializedData = JSON.parse(specRaw);
        } catch {}
      }

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        const saved = await saveUploadedFile(file);
        fileUrl = saved.publicUrl;
        fileName = file.name;
        fileType = file.type || 'application/octet-stream';
        fileSize = file.size;

        rawTextContent = await extractTextFromFile(file, saved.buffer);

        // Run AI analysis
        const userRec = await prisma.user.findUnique({ where: { id: user.id } });
        const aiResult = await analyzeDocumentContent(rawTextContent, file.name, itemType, userRec?.customApiKey);
        
        if (!title) title = aiResult.title;
        aiSummary = aiResult.summary;
        aiExtractedKeyValues = aiResult.extractedEntities;

        if (aiResult.suggestedTags && tagsInput.length === 0) {
          tagsInput = aiResult.suggestedTags;
        }
      }
    } else {
      const body = await req.json();
      title = body.title || 'Untitled Item';
      description = body.description || '';
      itemType = (body.itemType || 'DOCUMENT').toUpperCase();
      categoryId = body.categoryId || '';
      tagsInput = body.tags || [];
      importanceLevel = body.importanceLevel || 3;
      isFavorite = !!body.isFavorite;
      if (body.dateOccurred) dateOccurred = new Date(body.dateOccurred);
      fileUrl = body.fileUrl || null;
      fileName = body.fileName || null;
      fileType = body.fileType || null;
      fileSize = body.fileSize || null;
      rawTextContent = body.rawTextContent || description || '';
      aiSummary = body.aiSummary || '';
      aiExtractedKeyValues = body.aiExtractedKeyValues || null;
      specializedData = body.specializedData || {};

      if (!aiSummary && rawTextContent) {
        const userRec = await prisma.user.findUnique({ where: { id: user.id } });
        const aiResult = await analyzeDocumentContent(rawTextContent, title, itemType, userRec?.customApiKey);
        aiSummary = aiResult.summary;
        if (!aiExtractedKeyValues) aiExtractedKeyValues = aiResult.extractedEntities;
        if (tagsInput.length === 0 && aiResult.suggestedTags) tagsInput = aiResult.suggestedTags;
      }
    }

    if (!title) title = 'Untitled Archive Item';

    // Verify or find category
    let validCategoryId: string | null = null;
    if (categoryId && categoryId.trim()) {
      const cat = await prisma.category.findFirst({
        where: { id: categoryId, userId: user.id },
      });
      if (cat) validCategoryId = cat.id;
    }

    if (!validCategoryId) {
      const defaultCat = await prisma.category.findFirst({
        where: { userId: user.id },
      });
      validCategoryId = defaultCat?.id || null;
    }

    // Generate vector embedding
    const userRec = await prisma.user.findUnique({ where: { id: user.id } });
    const fullTextToEmbed = `${title} ${description} ${rawTextContent} ${aiSummary}`.trim();
    const vector = await generateDocumentEmbedding(fullTextToEmbed, userRec?.customApiKey);

    // Create Archive Item in Transaction
    const newItem = await prisma.archiveItem.create({
      data: {
        userId: user.id,
        categoryId: validCategoryId,
        title,
        description,
        itemType,
        fileUrl,
        fileName,
        fileType,
        fileSize,
        rawTextContent,
        aiSummary,
        aiExtractedKeyValues: aiExtractedKeyValues ? JSON.stringify(aiExtractedKeyValues) : null,
        importanceLevel,
        isFavorite,
        dateOccurred,
        embeddingCache: {
          create: {
            vectorData: JSON.stringify(vector),
            modelVersion: 'v1',
          },
        },
      },
    });

    // Save or link Tags
    if (Array.isArray(tagsInput) && tagsInput.length > 0) {
      for (const tName of tagsInput) {
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
            itemId: newItem.id,
            tagId: tag.id,
          },
        });
      }
    }

    // Save specialized metadata if applicable
    if (itemType === 'CERTIFICATE') {
      const issuer = specializedData.issuer || aiExtractedKeyValues?.issuerOrOrg || 'Issuing Authority';
      const skills = specializedData.skills || aiExtractedKeyValues?.skills || [];
      await prisma.certificateMeta.create({
        data: {
          itemId: newItem.id,
          issuer,
          credentialId: specializedData.credentialId || aiExtractedKeyValues?.credentialId,
          credentialUrl: specializedData.credentialUrl,
          issueDate: specializedData.issueDate ? new Date(specializedData.issueDate) : dateOccurred,
          expiryDate: specializedData.expiryDate ? new Date(specializedData.expiryDate) : null,
          skills: JSON.stringify(skills),
          doesExpire: !!specializedData.expiryDate,
        },
      });
    } else if (itemType === 'PROJECT') {
      const techStack = specializedData.techStack || aiExtractedKeyValues?.projectStack || aiExtractedKeyValues?.skills || [];
      const deliverables = specializedData.deliverables || aiExtractedKeyValues?.keyDeliverables || [];
      await prisma.projectMeta.create({
        data: {
          itemId: newItem.id,
          role: specializedData.role || aiExtractedKeyValues?.roleOrTitle || 'Creator / Developer',
          repositoryUrl: specializedData.repositoryUrl,
          liveDemoUrl: specializedData.liveDemoUrl,
          techStack: JSON.stringify(techStack),
          deliverables: JSON.stringify(deliverables),
          startDate: specializedData.startDate ? new Date(specializedData.startDate) : null,
          endDate: specializedData.endDate ? new Date(specializedData.endDate) : null,
        },
      });
    } else if (itemType === 'ACHIEVEMENT') {
      await prisma.achievementMeta.create({
        data: {
          itemId: newItem.id,
          organization: specializedData.organization || aiExtractedKeyValues?.issuerOrOrg,
          awardRank: specializedData.awardRank || aiExtractedKeyValues?.awardName,
          awardDate: specializedData.awardDate ? new Date(specializedData.awardDate) : dateOccurred,
          verificationProofUrl: specializedData.verificationProofUrl,
        },
      });
    } else if (itemType === 'NOTE') {
      await prisma.noteMeta.create({
        data: {
          itemId: newItem.id,
          markdownContent: specializedData.markdownContent || rawTextContent || description || '',
          checklist: specializedData.checklist ? JSON.stringify(specializedData.checklist) : null,
        },
      });
    }

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'CREATED',
        entityType: itemType,
        entityId: newItem.id,
        details: `Created archive item "${title}"`,
      },
    });

    const fullItem = await prisma.archiveItem.findUnique({
      where: { id: newItem.id },
      include: {
        category: true,
        tags: { include: { tag: true } },
        certificateMeta: true,
        projectMeta: true,
        achievementMeta: true,
        noteMeta: true,
      },
    });

    return NextResponse.json({ item: fullItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating archive item:', error);
    return NextResponse.json({ error: 'Failed to create archive item' }, { status: 500 });
  }
}
