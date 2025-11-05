import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash, compare } from 'bcryptjs';

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        bio: true,
        position: true,
        location: true,
        country: true,
        cityState: true,
        pinCode: true,
        profilePhoto: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get('id') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const mobile = formData.get('mobile') as string;
    const bio = formData.get('bio') as string;
    const position = formData.get('position') as string;
    const location = formData.get('location') as string;
    const country = formData.get('country') as string;
    const cityState = formData.get('cityState') as string;
    const pinCode = formData.get('pinCode') as string;
    const profilePhoto = formData.get('profilePhoto') as File | null;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let profilePhotoUrl: string | undefined;
    
    // Handle profile photo upload if provided
    if (profilePhoto && profilePhoto instanceof File) {
      const bytes = await profilePhoto.arrayBuffer();
      const buffer = Buffer.from(bytes);
      profilePhotoUrl = `data:${profilePhoto.type};base64,${buffer.toString('base64')}`;
    }

    const updateData: any = {
      firstName,
      lastName,
      email,
      mobile,
      bio,
      position,
      location,
      country,
      cityState,
      pinCode,
    };

    if (profilePhotoUrl) {
      updateData.profilePhoto = profilePhotoUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        bio: true,
        position: true,
        location: true,
        country: true,
        cityState: true,
        pinCode: true,
        profilePhoto: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// POST - Change password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword } = body;

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPasswordValid = await compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const hashedPassword = await hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
