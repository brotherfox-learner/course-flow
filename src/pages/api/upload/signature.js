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
    // Accept resource_type and folder from client request
    const { resource_type = 'video', folder = 'course-flow/videos' } = req.body || {};

    // Determine upload_preset based on resource_type
    const upload_preset = resource_type === 'image' 
      ? 'course_flow_image' 
      : 'course_flow_video';

    // Get timestamp
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Sign all params that will be sent to Cloudinary
    // upload_preset MUST be included in signature for signed uploads
    const paramsToSign = {
      timestamp: timestamp,
      folder: folder,
      upload_preset: upload_preset,
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    // Return signature data
    res.status(200).json({
      timestamp: timestamp,
      signature: signature,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      folder: folder,
      resource_type: resource_type,
      upload_preset: upload_preset,
    });

  } catch (error) {
    console.error('Signature generation error:', error);
    res.status(500).json({ error: 'Failed to generate signature' });
  }
}
