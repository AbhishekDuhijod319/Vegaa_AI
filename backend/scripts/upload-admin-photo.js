/**
 * One-time script: Upload admin photo to Cloudinary (secured).
 * Run: node scripts/upload-admin-photo.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const cloudinary = require('../src/config/cloudinary');
const fs = require('fs');

const PHOTO_PATH = path.join(__dirname, '../../frontend/public/admin-Photo.png');

async function uploadAdminPhoto() {
  if (!fs.existsSync(PHOTO_PATH)) {
    console.error('❌ Admin photo not found at:', PHOTO_PATH);
    process.exit(1);
  }

  console.log('📸 Uploading admin photo to Cloudinary (secured)...');

  try {
    const result = await cloudinary.uploader.upload(PHOTO_PATH, {
      folder: 'vegaa/admin',
      public_id: 'abhishek_duhijod_profile',
      overwrite: true,
      resource_type: 'image',
      // Secure: restrict downloads / direct access
      type: 'authenticated', // <-- Requires signed URL for access
      access_mode: 'authenticated',
      transformation: [
        { quality: 'auto', fetch_format: 'auto', width: 800, height: 800, crop: 'fill', gravity: 'face' }
      ],
    });

    console.log('✅ Upload successful!');
    console.log('   Public ID  :', result.public_id);
    console.log('   Secure URL :', result.secure_url);
    console.log('');
    console.log('🔑 To generate a signed URL (valid 1 hour):');
    
    const signedUrl = cloudinary.url(result.public_id, {
      type: 'authenticated',
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
    console.log('   Signed URL :', signedUrl);
    console.log('');
    console.log('📋 Add this to About.jsx OWNER.signedPhotoUrl (regenerate before expiry):');
    console.log(`   publicId: "${result.public_id}"`);
    console.log(`   secureUrl: "${result.secure_url}"`);

  } catch (err) {
    console.error('❌ Upload failed:', err.message);
    process.exit(1);
  }
}

uploadAdminPhoto();
