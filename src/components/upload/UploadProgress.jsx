import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadProgress({
  progress,
  status = 'uploading', // 'uploading', 'completed', 'error'
  fileName,
  fileSize,
  error,
  onCancel,
  className = '',
  showFileName = true,
  showFileSize = true,
}) {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Upload className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return `Uploading... ${progress}%`;
      case 'completed':
        return 'Upload completed';
      case 'error':
        return 'Upload failed';
      default:
        return 'Preparing...';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-600';
      case 'completed':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div className="space-y-1">
              {showFileName && fileName && (
                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                  {fileName}
                </p>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{getStatusText()}</span>
                {showFileSize && fileSize && (
                  <span className="text-xs text-gray-400">
                    ({formatFileSize(fileSize)})
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {status === 'uploading' && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={status === 'completed' ? 100 : progress} 
            className="w-full"
          />
          
          {/* Additional Info */}
          {error && status === 'error' && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          {status === 'completed' && (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
              File uploaded successfully
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// Variants for different use cases
export function VideoUploadProgress(props) {
  return (
    <UploadProgress
      {...props}
      className="border-blue-200"
    />
  );
}

export function ImageUploadProgress(props) {
  return (
    <UploadProgress
      {...props}
      className="border-green-200"
    />
  );
}

export function DocumentUploadProgress(props) {
  return (
    <UploadProgress
      {...props}
      className="border-purple-200"
    />
  );
}
