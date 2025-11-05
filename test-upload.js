#!/usr/bin/env node

/**
 * Test script for S3 presigned upload
 * 
 * Usage:
 *   node test-upload.js <path-to-test-file>
 * 
 * Example:
 *   node test-upload.js ./test.jpg
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_USER_EMAIL = 'admin@sakhu.org';
const TEST_USER_PASSWORD = 'admin123';

async function login() {
  console.log('🔐 Logging in...');
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ Login successful');
  return data.token;
}

async function getPresignedUrl(token, fileName, fileType, fileSize) {
  console.log('📝 Requesting presigned URL...');
  const response = await fetch(`${API_BASE_URL}/api/uploads/sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName,
      fileType,
      fileSize,
      uploadType: fileType.startsWith('video/') ? 'video' : 'image',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get presigned URL: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ Presigned URL generated');
  console.log('   Key:', data.key);
  console.log('   Expires in:', data.expiresIn, 'seconds');
  return data;
}

async function uploadFile(uploadUrl, filePath, fileType) {
  console.log('📤 Uploading file to S3...');
  const fileBuffer = fs.readFileSync(filePath);
  
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': fileType,
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }

  console.log('✅ File uploaded successfully');
  return response;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Usage: node test-upload.js <path-to-test-file>');
    console.error('   Example: node test-upload.js ./test.jpg');
    process.exit(1);
  }

  const filePath = args[0];
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    // Get file info
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    // Determine file type
    const typeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
    };
    
    const fileType = typeMap[ext] || 'application/octet-stream';
    const fileSize = stats.size;

    console.log('\n📋 File Information:');
    console.log('   Name:', fileName);
    console.log('   Type:', fileType);
    console.log('   Size:', (fileSize / 1024).toFixed(2), 'KB');
    console.log('');

    // Step 1: Login
    const token = await login();

    // Step 2: Get presigned URL
    const { uploadUrl, key, publicUrl } = await getPresignedUrl(token, fileName, fileType, fileSize);

    // Step 3: Upload file
    await uploadFile(uploadUrl, filePath, fileType);

    console.log('\n🎉 Upload completed successfully!');
    console.log('   S3 Key:', key);
    console.log('   Public URL:', publicUrl);
    console.log('\n💡 You can now use this key in your application.');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
