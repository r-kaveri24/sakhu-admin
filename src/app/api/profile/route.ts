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
    const body = await request.json();
    const {
      id: userId,
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
      profilePhoto, // Expect an S3 public URL string
    } = body || {};

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof firstName === 'string') updateData.firstName = firstName;
    if (typeof lastName === 'string') updateData.lastName = lastName;
    if (typeof email === 'string') updateData.email = email;
    if (typeof mobile === 'string') updateData.mobile = mobile;
    if (typeof bio === 'string' || bio == null) updateData.bio = bio ?? null;
    if (typeof position === 'string' || position == null) updateData.position = position ?? null;
    if (typeof location === 'string' || location == null) updateData.location = location ?? null;
    if (typeof country === 'string' || country == null) updateData.country = country ?? null;
    if (typeof cityState === 'string' || cityState == null) updateData.cityState = cityState ?? null;
    if (typeof pinCode === 'string' || pinCode == null) updateData.pinCode = pinCode ?? null;
    if (typeof profilePhoto === 'string' || profilePhoto == null) updateData.profilePhoto = profilePhoto ?? null;

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
