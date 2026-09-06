import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from './prisma';
import { UserSession } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-personal-archive-fallback-secret-2026';
const COOKIE_NAME = 'archive_token';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signJwtToken(payload: { id: string; email: string; fullName: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): { id: string; email: string; fullName: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; fullName: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyJwtToken(token);
    if (!payload?.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        aiProvider: true,
      },
    });

    return user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function authenticateRequest(req: NextRequest): Promise<UserSession | null> {
  try {
    // 1. Check Authorization header
    const authHeader = req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    // 2. Check Cookie
    if (!token) {
      token = req.cookies.get(COOKIE_NAME)?.value || null;
    }

    if (!token) return null;

    const payload = verifyJwtToken(token);
    if (!payload?.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        aiProvider: true,
      },
    });

    return user || null;
  } catch (error) {
    console.error('Error authenticating request:', error);
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
}
