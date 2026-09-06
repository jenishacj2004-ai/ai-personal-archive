import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signJwtToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const demoEmail = 'demo@archive.ai';
    let user = await prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (!user) {
      // Auto-create demo user if not yet seeded
      user = await prisma.user.create({
        data: {
          email: demoEmail,
          fullName: 'Alex Morgan',
          passwordHash: '$2a$10$YourHashedDemoPasswordPlaceholder',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          aiProvider: 'gemini',
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
    console.error('Demo login error:', error);
    return NextResponse.json({ error: 'Failed to initialize demo session' }, { status: 500 });
  }
}
