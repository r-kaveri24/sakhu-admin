# S3 Presigned Upload Testing

## Prerequisites

1. Update `.env` with your AWS credentials:
```env
AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_S3_BUCKET="sakhu-uploads"
S3_UPLOAD_EXPIRES_IN=900
```

2. Make sure your S3 bucket has CORS configured:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## Automated Testing

### Using Node.js Test Script

```bash
# Test with an image
node test-upload.js ./test.jpg

# Test with a video
node test-upload.js ./test.mp4
```

## Manual Testing with cURL

### Step 1: Login and Get Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sakhu.org","password":"admin123"}' \
  | jq -r '.token'
```

Save the token output for next step.

### Step 2: Get Presigned URL

```bash
curl -X POST http://localhost:3000/api/uploads/sign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "fileName": "test.jpg",
    "fileType": "image/jpeg",
    "fileSize": 50000,
    "uploadType": "image"
  }'
```

Response example:
```json
{
  "uploadUrl": "https://sakhu-uploads.s3.ap-south-1.amazonaws.com/images/2025-11-05/uuid-test.jpg?X-Amz-Algorithm=...",
  "key": "images/2025-11-05/uuid-test.jpg",
  "expiresIn": 900,
  "bucket": "sakhu-uploads",
  "region": "ap-south-1",
  "publicUrl": "https://sakhu-uploads.s3.ap-south-1.amazonaws.com/images/2025-11-05/uuid-test.jpg"
}
```

### Step 3: Upload File to S3

Copy the `uploadUrl` from the previous response and use it here:

```bash
curl -v -X PUT -T ./test.jpg \
  -H "Content-Type: image/jpeg" \
  "PASTE_THE_UPLOAD_URL_HERE"
```

Expected response: **200 OK** or **204 No Content**

### Step 4: Verify Upload

Access the `publicUrl` in your browser or:

```bash
curl -I "PASTE_THE_PUBLIC_URL_HERE"
```

## Testing Different File Types

### Image Upload
```bash
curl -X POST http://localhost:3000/api/uploads/sign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fileName": "photo.png",
    "fileType": "image/png",
    "fileSize": 100000,
    "uploadType": "image"
  }'
```

### Video Upload
```bash
curl -X POST http://localhost:3000/api/uploads/sign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fileName": "video.mp4",
    "fileType": "video/mp4",
    "fileSize": 5000000,
    "uploadType": "video"
  }'
```

## Validation Tests

### Test File Type Validation (should fail)
```bash
curl -X POST http://localhost:3000/api/uploads/sign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fileName": "doc.pdf",
    "fileType": "application/pdf",
    "fileSize": 50000
  }'
```

Expected: `400 Bad Request` - File type not allowed

### Test File Size Validation (should fail)
```bash
curl -X POST http://localhost:3000/api/uploads/sign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fileName": "large.jpg",
    "fileType": "image/jpeg",
    "fileSize": 20000000
  }'
```

Expected: `400 Bad Request` - File size exceeds maximum

### Test Authentication (should fail)
```bash
curl -X POST http://localhost:3000/api/uploads/sign \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.jpg",
    "fileType": "image/jpeg",
    "fileSize": 50000
  }'
```

Expected: `401 Unauthorized`

## Troubleshooting

### CORS Errors
- If cURL works but browser fails → CORS configuration issue
- Check S3 bucket CORS settings
- Ensure `AllowedOrigins` includes your domain

### 403 Forbidden
- Check AWS credentials in `.env`
- Verify IAM user has `s3:PutObject` permission
- Check bucket policy

### SignatureDoesNotMatch
- Verify AWS credentials are correct
- Check system time is synchronized
- Ensure no special characters in credentials

### Connection Timeout
- Check AWS region matches bucket region
- Verify network connectivity
- Check firewall settings
