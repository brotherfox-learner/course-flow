import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/context/AuthContext';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const SUPPORTED_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm'];

export function useVideoUpload() {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedVideo, setUploadedVideo] = useState(null);

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
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/webm'
    ];

    if (!supportedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload a valid video file.'
      };
    }

    return { valid: true };
  };

  const uploadVideo = useCallback(async (file) => {
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
      // Step 1: Get signature from API
      const signatureResponse = await fetch('/api/upload/signature', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
        formData.append('resource_type', signatureData.resource_type);
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

              const videoData = {
                public_id: data.public_id,
                secure_url: data.secure_url,
                format: data.format,
                size: data.bytes,
                duration: data.duration,
                width: data.width,
                height: data.height,
                created_at: data.created_at,
                thumbnail_url: data.thumbnail_url || data.secure_url.replace(/\.[^/.]+$/, '.jpg'),
              };

              setUploadedVideo(videoData);
              setProgress(100);
              resolve(videoData);
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

        // Setup and send request
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/${signatureData.resource_type}/upload`);
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
    setUploadedVideo(null);
  }, []);

  return {
    uploadVideo,
    uploading,
    progress,
    error,
    uploadedVideo,
    resetUpload,
    validateFile,
  };
}
