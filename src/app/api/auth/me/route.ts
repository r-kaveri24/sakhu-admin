import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

// GET /api/auth/me - Get current user
export async function GET(request: NextRequest) {
  const user = authenticate(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: {
      id: user.userId,
      email: user.email,
      role: user.role,
    },
  });
}
