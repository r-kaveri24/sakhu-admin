import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthenticatedRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/users - List all users (Admin only)
async function getHandler(request: AuthenticatedRequest) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}

export const GET = requireAdmin(getHandler);
