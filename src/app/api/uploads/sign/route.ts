import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import s3Client, { S3_BUCKET, UPLOAD_EXPIRES_IN } from '@/lib/s3';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth';

// Allowed file types (images only)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES];

// Max file size for images (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

interface SignRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadType?: 'image';
  feature?: string; // e.g., 'hero' | 'testimonials' | 'news' | 'gallery_photo'
  resourceId?: string; // optional id for scoping keys (e.g., testimonialId)
  slug?: string; // optional slug for news
  breakpoint?: 'desktop' | 'tablet' | 'mobile'; // hero images
}

async function handlePresign(request: AuthenticatedRequest) {
  try {
    const body: SignRequest = await request.json();
    const { fileName, fileType, fileSize, uploadType = 'image', feature, resourceId, slug, breakpoint } = body;

    // Validate required fields
    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, fileType, fileSize' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: `File type ${fileType} is not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size (images only)
    const isImage = ALLOWED_IMAGE_TYPES.includes(fileType);
    const maxSize = MAX_IMAGE_SIZE;

    if (!isImage || fileSize > maxSize) {
      return NextResponse.json(
        { error: `Only image uploads are allowed. Max size ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Generate unique file key
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const datePrefix = `${year}-${month}-${day}`;
    
    // Extract file extension
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Create unique key with optional feature-based foldering
    const uniqueId = uuidv4();
    let baseFolder = 'images';

    if (feature) {
      switch (feature) {
        case 'hero': {
          const bp = breakpoint || 'desktop';
          baseFolder = `hero/${bp}`;
          break;
        }
        case 'testimonials': {
          const scope = resourceId || 'general';
          baseFolder = `testimonials/${scope}/image`;
          break;
        }
        case 'news': {
          const scope = slug || 'article';
          baseFolder = `news/${scope}`;
          break;
        }
        case 'gallery_photo': {
          baseFolder = `gallery/photos/${year}/${month}/${uniqueId}`;
          break;
        }
        // 'gallery_video' feature removed
        case 'team': {
          baseFolder = `team/${year}/${month}`;
          break;
        }
        case 'volunteer': {
          baseFolder = `volunteer/${year}/${month}`;
          break;
        }
        case 'profile': {
          const uid = request.user?.userId || 'user';
          baseFolder = `profile/${uid}/${year}/${month}`;
          break;
        }
        default: {
          // keep default folder
        }
      }
    }

    const key = `${baseFolder}/${datePrefix}/${uniqueId}-${sanitizedFileName}`;

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: UPLOAD_EXPIRES_IN,
    });

    // Return presigned URL and metadata
    return NextResponse.json({
      uploadUrl,
      key,
      expiresIn: UPLOAD_EXPIRES_IN,
      bucket: S3_BUCKET,
      region: process.env.AWS_REGION,
      publicUrl: `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

// POST /api/uploads/sign - Generate presigned URL for upload
export const POST = requireAuth(handlePresign);
