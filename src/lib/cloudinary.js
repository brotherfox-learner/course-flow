import { v2 as cloudinary } from 'cloudinary';

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload configuration
export const uploadConfig = {
  folder: 'course-videos',
  resource_type: 'video',
  allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  max_file_size: 50 * 1024 * 1024, // 50MB
  transformation: [
    {
      quality: 'auto:good',
      fetch_format: 'auto',
    },
  ],
};

// Upload video function
export async function uploadVideo(file, options = {}) {
  try {
    const result = await cloudinary.uploader.upload(file, {
      ...uploadConfig,
      ...options,
    });

    return {
      success: true,
      data: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        duration: result.duration,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        created_at: result.created_at,
      },
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Delete video function
export async function deleteVideo(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video',
    });

    return {
      success: result.result === 'ok',
      data: result,
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Get video info function
export async function getVideoInfo(publicId) {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'video',
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Cloudinary get info error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export default cloudinary;
