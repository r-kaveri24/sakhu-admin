import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

// POST /api/auth/logout - Logout user
export async function POST() {
  // Clear auth cookie
  const cookie = serialize('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.headers.set('Set-Cookie', cookie);

  return response;
}
