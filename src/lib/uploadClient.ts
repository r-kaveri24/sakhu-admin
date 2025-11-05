export type PresignOptions = {
  feature?: string;
  breakpoint?: 'desktop' | 'tablet' | 'mobile';
  resourceId?: string;
  slug?: string;
};

export async function presignAndUpload(
  file: File,
  options: PresignOptions = {}
): Promise<{ key: string; publicUrl: string }> {
  const res = await fetch('/api/uploads/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      feature: options.feature,
      breakpoint: options.breakpoint,
      resourceId: options.resourceId,
      slug: options.slug,
    }),
  });

  if (!res.ok) {
    let msg = 'Failed to presign upload';
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const { uploadUrl, key, publicUrl } = await res.json();

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error('Failed to upload to S3');
  }

  return { key, publicUrl };
}

export function s3KeyFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\//, '');
  } catch {
    return null;
  }
}