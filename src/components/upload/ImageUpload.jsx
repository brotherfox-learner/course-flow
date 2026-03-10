import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
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
  
  const { uploadImage, uploading, progress, error, uploadedImage, resetUpload } = useImageUpload();

  // Initialize preview if value is provided
  useState(() => {
    if (value && typeof value === 'object') {
      setPreview(value);
    }
  });

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

    // Upload image
    const result = await uploadImage(file);
    
    if (result) {
      // Clean up preview URL
      if (preview?.preview) {
        URL.revokeObjectURL(preview.preview);
      }
      
      // Set new preview with uploaded image info
      setPreview({
        name: file.name,
        size: result.size,
        type: result.format,
        preview: result.secure_url,
        width: result.width,
        height: result.height,
        secure_url: result.secure_url,
        public_id: result.public_id,
      });
      
      // Call onChange with image data
      onChange(result);
    } else {
      // Reset preview on error
      if (preview?.preview) {
        URL.revokeObjectURL(preview.preview);
      }
      setPreview(null);
    }
  }, [uploadImage, onChange, preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
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
                {isDragActive ? 'Drop image here' : 'Upload image'}
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

      {/* Upload Progress */}
      {uploading && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uploading image...</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
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
        <Card className="p-4">
          <div className="space-y-4">
            {/* Image Info */}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ImageIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-gray-900">{preview.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formatFileSize(preview.size)}</span>
                    {preview.width && preview.height && (
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
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
