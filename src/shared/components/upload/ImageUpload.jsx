import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function ImageUpload({ 
  value, 
  onChange, 
  className = '',
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  aspectRatio = 'free' // 'free', 'square', '16:9', '4:3'
}) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  // Initialize preview if value is provided (existing image from DB or new file)
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
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
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
    if (bytes == null || typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const displayName = preview?.name === 'cover' ? 'Cover image' : (preview?.name || 'Image');

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case '16:9':
        return 'aspect-video';
      case '4:3':
        return 'aspect-[4/3]';
      default:
        return '';
    }
  };

  return (
    <div className={`space-y-4 ${className} `}>
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
                {isDragActive ? 'Drop Image here' : 'Upload Image'}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-400">
                Supported formats: JPG, PNG, GIF, WebP, SVG
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

      {/* Image Preview */}
      {preview && (
        <Card className={`p-4 ${className}`}>
          <div className="space-y-4">
            {/* Image Info */}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ImageIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="font-medium text-gray-900 truncate max-w-[150px]" title={displayName}>{displayName}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formatFileSize(preview.size)}</span>
                    {typeof preview.width === 'number' && typeof preview.height === 'number' && Number.isFinite(preview.width) && Number.isFinite(preview.height) && (
                      <span>{preview.width} × {preview.height}px</span>
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

            {/* Image Preview */}
            <div className={`relative rounded-lg overflow-hidden bg-gray-100 ${getAspectRatioClass()}`}>
              <img
                src={preview.preview}
                alt={preview.name}
                className="w-full h-full min-h-[200px] max-h-[200px] object-fill"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
