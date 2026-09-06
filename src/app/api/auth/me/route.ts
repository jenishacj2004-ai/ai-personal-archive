import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        aiProvider: true,
        customApiKey: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: fullUser });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fullName, avatarUrl, aiProvider, customApiKey } = await req.json();

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: fullName !== undefined ? fullName : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        aiProvider: aiProvider !== undefined ? aiProvider : undefined,
        customApiKey: customApiKey !== undefined ? customApiKey : undefined,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        aiProvider: true,
        customApiKey: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
