import 'dotenv/config';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

const region = process.env.AWS_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

const client = new STSClient({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

try {
  const id = await client.send(new GetCallerIdentityCommand({}));
  console.log('CallerIdentity:', id);
} catch (e) {
  const status = e && e.$metadata ? e.$metadata.httpStatusCode : undefined;
  console.error('GetCallerIdentity failed:', { name: e.name, status, code: e.Code, message: e.message });
  process.exitCode = 1;
}