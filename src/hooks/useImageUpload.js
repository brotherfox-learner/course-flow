import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/features/auth/context/AuthContext';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

export function useImageUpload() {
  const { token } = useAuth();
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
      // Step 1: Get signature from API (request image-specific params)
      const signatureResponse = await fetch('/api/upload/signature', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resource_type: 'image',
          folder: 'course-flow/images',
        }),
      });

      if (!signatureResponse.ok) {
        throw new Error('Failed to get upload signature');
      }

      const signatureData = await signatureResponse.json();

      // Step 2: Upload to Cloudinary with signature (using XMLHttpRequest for progress)
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('timestamp', signatureData.timestamp);
        formData.append('signature', signatureData.signature);
        formData.append('api_key', signatureData.api_key);
        formData.append('folder', signatureData.folder);
        formData.append('upload_preset', signatureData.upload_preset);

        const xhr = new XMLHttpRequest();
        
        // Progress tracking
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete);
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              
              if (data.error) {
                setError(data.error.message || 'Upload failed');
                reject(new Error(data.error.message));
                return;
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
              resolve(imageData);
            } catch (parseError) {
              setError('Failed to parse upload response');
              reject(parseError);
            }
          } else {
            setError(`Upload failed with status: ${xhr.status}`);
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          setError('Network error during upload');
          reject(new Error('Network error during upload'));
        });

        // Setup and send request - use image resource_type in URL
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/image/upload`);
        xhr.send(formData);
      });
    } catch (err) {
      const errorMessage = err.message || 'Upload failed';
      setError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  }, [token]);

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
