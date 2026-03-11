import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, FileVideo, AlertCircle } from 'lucide-react';

export default function VideoUpload({ 
  value, 
  onChange, 
  className = '',
  maxSize = 50 * 1024 * 1024, // 50MB
  disabled = false,
  compact = false,
}) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  // Initialize preview if value is provided (existing video from DB or new file)
  useEffect(() => {
    if (value && typeof value === 'object') {
      setPreview(value);
    }
  }, [value]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setError(null);

    // Clean up old blob preview
    if (preview?.preview && preview.preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview.preview);
    }

    // Store File locally with blob preview — NO Cloudinary upload yet
    const previewUrl = URL.createObjectURL(file);
    const fileData = {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: previewUrl,
    };
    
    setPreview(fileData);
    onChange(fileData);
  }, [onChange, preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    maxSize,
    multiple: false,
    disabled,
  });

  const handleRemove = useCallback(() => {
    if (preview?.preview && preview.preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview.preview);
    }
    setPreview(null);
    setError(null);
    onChange(null);
  }, [onChange, preview]);

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

  // ── Compact layout (for SubLessonCard / inline contexts) ──
  if (compact) {
    return (
      <div className={`${className}`}>
        {!preview && (
          <div
            className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-colors cursor-pointer
              w-[160px] h-[160px]
              ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-blue-300 hover:border-[#8BA4D4] bg-[#F8FAFC] hover:bg-blue-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            <span className="text-3xl font-light text-[#2F5FAC] mb-1">+</span>
            <span className="text-[13px] font-medium text-[#2F5FAC]">Upload Video</span>
            <span className="text-[10px] text-slate-400 mt-1">Max {formatFileSize(maxSize)}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
        )}

        {preview && (
          <div className="relative w-[240px]">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                src={preview.preview}
                className="w-full h-[135px] object-contain"
                controls
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate" title={preview.name}>
              {preview.name}{preview.size ? ` (${formatFileSize(preview.size)})` : ''}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Default (full-size) layout ──
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

      {/* Error Message */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        </Card>
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
