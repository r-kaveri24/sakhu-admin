import 'dotenv/config';
import { S3Client, HeadBucketCommand, ListBucketsCommand, GetBucketLocationCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucket = process.env.AWS_S3_BUCKET || 'sakhu-uploads';
const region = process.env.AWS_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

console.log('AWS env present:', {
  bucketPresent: !!process.env.AWS_S3_BUCKET,
  regionPresent: !!process.env.AWS_REGION,
  keyPresent: !!accessKeyId,
  secretPresent: !!secretAccessKey,
});
console.log('Using bucket:', bucket, 'region:', region);

const client = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

try {
  // Try listing buckets to confirm identity and permissions
  try {
    const list = await client.send(new ListBucketsCommand({}));
    console.log('ListBuckets success, bucket count:', list.Buckets?.length ?? 0);
  } catch (e) {
    const status = e && e.$metadata ? e.$metadata.httpStatusCode : undefined;
    console.error('ListBuckets failed:', { name: e.name, status, code: e.Code, message: e.message });
  }

  // Attempt to get bucket location (requires s3:GetBucketLocation)
  try {
    const loc = await client.send(new GetBucketLocationCommand({ Bucket: bucket }));
    console.log('GetBucketLocation:', loc.LocationConstraint || 'us-east-1');
  } catch (e) {
    const status = e && e.$metadata ? e.$metadata.httpStatusCode : undefined;
    console.error('GetBucketLocation failed:', { name: e.name, status, code: e.Code, message: e.message });
  }

  await client.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log('S3 HeadBucket success for', bucket);
  // Attempt presign PUT on a test key and try uploading small content
  try {
    const key = `diagnostics/${Date.now()}-probe.txt`;
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: 'text/plain' });
    const url = await getSignedUrl(client, cmd, { expiresIn: 60 });
    console.log('Presigned PUT URL generated for key:', key);
    const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: 'aws connectivity probe' });
    console.log('Presigned PUT response:', res.status, res.statusText);
    if (!res.ok) {
      const text = await res.text();
      console.error('Presigned PUT failed body:', text.substring(0, 300));
      process.exitCode = 1;
    }
  } catch (e) {
    console.error('Presign PUT test failed:', { name: e.name, message: e.message });
    process.exitCode = 1;
  }
} catch (e) {
  const status = e && e.$metadata ? e.$metadata.httpStatusCode : undefined;
  console.error('S3 HeadBucket failed:', {
    name: e.name,
    status,
    code: e.Code,
    message: e.message,
  });
  process.exitCode = 1;
}

// Run presign PUT test regardless of HeadBucket outcome to diagnose object permissions
try {
  const key = `diagnostics/${Date.now()}-probe.txt`;
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: 'text/plain' });
  const url = await getSignedUrl(client, cmd, { expiresIn: 60 });
  console.log('Presigned PUT URL generated for key:', key);
  const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: 'aws connectivity probe' });
  console.log('Presigned PUT response:', res.status, res.statusText);
  if (!res.ok) {
    const text = await res.text();
    console.error('Presigned PUT failed body:', text.substring(0, 300));
    process.exitCode = 1;
  }
} catch (e) {
  console.error('Presign PUT test failed:', { name: e.name, message: e.message });
  process.exitCode = 1;
}