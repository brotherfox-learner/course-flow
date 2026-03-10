import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Play, FileVideo, AlertCircle } from 'lucide-react';
import UploadProgress from './UploadProgress';

export default function VideoUpload({ 
  value, 
  onChange, 
  className = '',
  maxSize = 50 * 1024 * 1024, // 50MB
  disabled = false,
  lessonId = null,
  videoTitle = null
}) {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { token } = useAuth();
  const { uploadVideo, uploading, progress, error, uploadedVideo, resetUpload } = useVideoUpload();

  // Initialize preview if value is provided
  useState(() => {
    if (value && typeof value === 'object') {
      setPreview(value);
    }
  });

  // Save video metadata to database
  const saveVideoMetadata = useCallback(async (videoData) => {
    if (!lessonId || !videoTitle || !token) {
      console.warn('Missing required data for saving to database');
      return videoData;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/videos/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          title: videoTitle,
          public_id: videoData.public_id,
          video_url: videoData.secure_url,
          thumbnail_url: videoData.thumbnail_url,
          duration: videoData.duration,
          format: videoData.format,
          size: videoData.size,
          width: videoData.width,
          height: videoData.height,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save video metadata');
      }

      const result = await response.json();
      console.log('Video metadata saved successfully:', result);
      
      return { ...videoData, database_id: result.data.id };
    } catch (error) {
      console.error('Error saving video metadata:', error);
      // Don't fail the upload, just log the error
      return videoData;
    } finally {
      setSaving(false);
    }
  }, [lessonId, videoTitle, token]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview({
      name: file.name,
      size: file.size,
      type: file.type,
      preview: previewUrl,
    });

    // Upload video
    const result = await uploadVideo(file);
    
    if (result) {
      // Clean up preview URL
      if (preview?.preview) {
        URL.revokeObjectURL(preview.preview);
      }
      
      // Save metadata to database (if lessonId and videoTitle provided)
      const finalResult = await saveVideoMetadata(result);
      
      // Set new preview with uploaded video info
      setPreview({
        name: file.name,
        size: result.size,
        type: result.format,
        preview: result.secure_url,
        duration: result.duration,
        secure_url: result.secure_url,
        public_id: result.public_id,
        database_id: finalResult.database_id,
      });
      
      // Call onChange with video data
      onChange(finalResult);
    } else {
      // Reset preview on error
      if (preview?.preview) {
        URL.revokeObjectURL(preview.preview);
      }
      setPreview(null);
    }
  }, [uploadVideo, onChange, preview, saveVideoMetadata]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    maxSize,
    multiple: false,
    disabled: disabled || uploading,
  });

  const handleRemove = useCallback(() => {
    if (preview?.preview && preview.preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview.preview);
    }
    setPreview(null);
    onChange(null);
    resetUpload();
  }, [onChange, resetUpload, preview]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {!preview && (
        <Card 
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          {...getRootProps()}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                {isDragActive ? 'Drop video here' : 'Upload video trailer'}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-400">
                Supported formats: MP4, MOV, AVI, MKV, WebM
              </p>
              <p className="text-xs text-gray-400">
                Maximum file size: {formatFileSize(maxSize)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Upload Progress */}
      {uploading && (
        <UploadProgress
          progress={progress}
          status="uploading"
          fileName={preview?.name}
          fileSize={preview?.size}
          onCancel={resetUpload}
        />
      )}

      {/* Error Message */}
      {error && (
        <UploadProgress
          progress={progress}
          status="error"
          fileName={preview?.name}
          fileSize={preview?.size}
          error={error}
        />
      )}

      {/* Video Preview */}
      {preview && (
        <Card className="p-4">
          <div className="space-y-4">
            {/* Video Info */}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileVideo className="w-6 h-6 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-gray-900">{preview.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formatFileSize(preview.size)}</span>
                    {preview.duration && (
                      <span>{formatDuration(preview.duration)}</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Video Preview */}
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                src={preview.preview}
                className="w-full h-auto max-h-64 object-contain"
                controls
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
