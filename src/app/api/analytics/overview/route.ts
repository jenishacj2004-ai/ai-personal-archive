import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await prisma.archiveItem.findMany({
      where: { userId: user.id, isArchived: false },
      include: {
        category: true,
        tags: { include: { tag: true } },
        certificateMeta: true,
        projectMeta: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalItems = items.length;
    let totalDocuments = 0;
    let totalCertificates = 0;
    let totalProjects = 0;
    let totalAchievements = 0;
    let totalNotes = 0;
    let totalStorageBytes = 0;
    let aiInsightsCount = 0;

    const skillCounts: Record<string, number> = {};
    const categoryCounts: Record<string, { name: string; color: string; count: number }> = {};

    items.forEach(item => {
      if (item.fileSize) totalStorageBytes += item.fileSize;
      if (item.aiSummary) aiInsightsCount++;

      switch (item.itemType) {
        case 'DOCUMENT':
          totalDocuments++;
          break;
        case 'CERTIFICATE':
          totalCertificates++;
          break;
        case 'PROJECT':
          totalProjects++;
          break;
        case 'ACHIEVEMENT':
          totalAchievements++;
          break;
        case 'NOTE':
          totalNotes++;
          break;
      }

      if (item.category) {
        if (!categoryCounts[item.category.id]) {
          categoryCounts[item.category.id] = {
            name: item.category.name,
            color: item.category.color,
            count: 0,
          };
        }
        categoryCounts[item.category.id].count++;
      }

      // Collect skills from certs & projects
      try {
        if (item.certificateMeta?.skills) {
          const sList = JSON.parse(item.certificateMeta.skills);
          sList.forEach((s: string) => {
            skillCounts[s] = (skillCounts[s] || 0) + 1;
          });
        }
        if (item.projectMeta?.techStack) {
          const sList = JSON.parse(item.projectMeta.techStack);
          sList.forEach((s: string) => {
            skillCounts[s] = (skillCounts[s] || 0) + 1;
          });
        }
      } catch {}
    });

    const topSkills = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const categoryBreakdown = Object.values(categoryCounts);

    const recentActivities = await prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: 'desc' },
      take: 6,
    });

    return NextResponse.json({
      stats: {
        totalItems,
        totalDocuments,
        totalCertificates,
        totalProjects,
        totalAchievements,
        totalNotes,
        totalStorageBytes,
        aiInsightsCount,
        topSkills,
        categoryBreakdown,
        recentUploads: items.slice(0, 5),
        recentActivities,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
