import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get timestamp
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Upload parameters
    const params = {
      timestamp: timestamp,
      folder: 'course-videos',
      resource_type: 'video',
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'video_preset',
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    // Return signature data
    res.status(200).json({
      timestamp: timestamp,
      signature: signature,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      folder: params.folder,
      resource_type: params.resource_type,
      upload_preset: params.upload_preset,
    });

  } catch (error) {
    console.error('Signature generation error:', error);
    res.status(500).json({ error: 'Failed to generate signature' });
  }
}
