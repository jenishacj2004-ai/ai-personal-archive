import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signJwtToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, password, and full name are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        fullName: fullName.trim(),
        passwordHash,
      },
    });

    // Create default categories for user
    const defaultCategories = [
      { name: 'Education & Certifications', slug: 'education-certifications', color: '#10b981', icon: 'Award', isSystemDefault: true },
      { name: 'Projects & Portfolios', slug: 'projects-portfolios', color: '#6366f1', icon: 'FolderGit2', isSystemDefault: true },
      { name: 'Honors & Awards', slug: 'honors-awards', color: '#f59e0b', icon: 'Trophy', isSystemDefault: true },
      { name: 'Personal Notes & Logs', slug: 'personal-notes', color: '#a855f7', icon: 'StickyNote', isSystemDefault: true },
      { name: 'Career & Work', slug: 'career-work', color: '#3b82f6', icon: 'Briefcase', isSystemDefault: true },
      { name: 'Financial & Legal', slug: 'financial-legal', color: '#ec4899', icon: 'FileText', isSystemDefault: true },
    ];

    for (const cat of defaultCategories) {
      await prisma.category.create({
        data: {
          userId: user.id,
          name: cat.name,
          slug: cat.slug,
          color: cat.color,
          icon: cat.icon,
          isSystemDefault: true,
        },
      });
    }

    const token = signJwtToken({ id: user.id, email: user.email, fullName: user.fullName });
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        aiProvider: user.aiProvider,
      },
      token,
    });

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error during registration' }, { status: 500 });
  }
}
