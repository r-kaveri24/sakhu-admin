import 'dotenv/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucket = process.env.AWS_S3_BUCKET;
const region = process.env.AWS_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

if (!bucket) {
  console.error('Missing AWS_S3_BUCKET in env');
  process.exit(1);
}

const client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });

try {
  const key = `diagnostics/${Date.now()}-presign-probe.txt`;
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: 'text/plain' });
  const url = await getSignedUrl(client, cmd, { expiresIn: 60 });
  console.log('Presigned PUT URL generated for key:', key);
  const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: 'sakhu-media presign test' });
  console.log('Presigned PUT response:', res.status, res.statusText);
  if (!res.ok) {
    const text = await res.text();
    console.error('Upload failed body:', text.substring(0, 300));
    process.exitCode = 1;
  } else {
    console.log('Upload succeeded for key:', key);
  }
} catch (e) {
  console.error('Presign test error:', { name: e.name, message: e.message });
  process.exitCode = 1;
}