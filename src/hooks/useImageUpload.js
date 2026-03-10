import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  const validateFile = (file) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Check file format
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!SUPPORTED_FORMATS.includes(fileExtension)) {
      return {
        valid: false,
        error: `Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`
      };
    }

    // Check MIME type
    const supportedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];

    if (!supportedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload a valid image file.'
      };
    }

    return { valid: true };
  };

  const uploadImage = useCallback(async (file) => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return null;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Create FormData for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'image_preset'); // You need to create this preset in Cloudinary
      formData.append('resource_type', 'image');
      formData.append('folder', 'course-flow/images');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error.message);
        return null;
      }

      const imageData = {
        public_id: data.public_id,
        secure_url: data.secure_url,
        format: data.format,
        size: data.bytes,
        width: data.width,
        height: data.height,
        created_at: data.created_at,
      };

      setUploadedImage(imageData);
      setProgress(100);
      return imageData;
    } catch (err) {
      const errorMessage = err.message || 'Upload failed';
      setError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const resetUpload = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadedImage(null);
  }, []);

  return {
    uploadImage,
    uploading,
    progress,
    error,
    uploadedImage,
    resetUpload,
    validateFile,
  };
}
