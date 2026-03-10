# Upload Components Documentation

## Overview

This document provides comprehensive documentation for the upload components system in the Course Flow application. The system is built to handle video and image uploads using Cloudinary as the storage provider.

## Environment Variables

The upload system requires the following environment variables in your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=ddmjq5a4k
CLOUDINARY_API_KEY=567562931566656
CLOUDINARY_API_SECRET=UJptkwEU_6b5EqFdlpcRT_AoufM

# Database and API (for reference)
CONNECTION_STRING=postgresql://postgres.jwuksxgnedlqnxzcbawp:wrc9q4w7aOSBV1BebUmIbSOXCnoNoum@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://jwuksxgnedlqnxzcbawp.supabase.co/
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_[KEY]
SUPABASE_SERVICE_ROLE_KEY=sb_secret_[KEY]

# Omise Payment (for reference)
NEXT_PUBLIC_OMISE_PUBLIC_KEY=pkey_test_66revl1g536pdmu6euf
OMISE_SECRET_KEY=skey_test_66revl21g9xt639uari
```

## Components Structure

```
src/
├── hooks/
│   ├── useVideoUpload.js
│   └── useImageUpload.js
└── components/upload/
    ├── VideoUpload.jsx
    ├── ImageUpload.jsx
    └── UploadProgress.jsx
```

## Hooks

### useVideoUpload

A custom hook for handling video uploads to Cloudinary.

#### Features:
- File validation (size, format, MIME type)
- Progress tracking
- Error handling
- Cloudinary integration
- Maximum file size: 100MB
- Supported formats: MP4, MOV, AVI, MKV, WebM

#### Usage:
```jsx
import { useVideoUpload } from '@/hooks/useVideoUpload';

function MyComponent() {
  const { uploadVideo, uploading, progress, error, uploadedVideo, resetUpload } = useVideoUpload();

  const handleUpload = async (file) => {
    const result = await uploadVideo(file);
    if (result) {
      console.log('Video uploaded:', result);
    }
  };

  return (
    // Your component JSX
  );
}
```

#### Return Values:
- `uploadVideo`: Function to upload a video file
- `uploading`: Boolean indicating upload status
- `progress`: Number (0-100) indicating upload progress
- `error`: String containing error message if any
- `uploadedVideo`: Object containing uploaded video data
- `resetUpload`: Function to reset upload state
- `validateFile`: Function to validate a file before upload

### useImageUpload

A custom hook for handling image uploads to Cloudinary.

#### Features:
- File validation (size, format, MIME type)
- Progress tracking
- Error handling
- Cloudinary integration
- Maximum file size: 10MB
- Supported formats: JPG, JPEG, PNG, GIF, WebP, SVG

#### Usage:
```jsx
import { useImageUpload } from '@/hooks/useImageUpload';

function MyComponent() {
  const { uploadImage, uploading, progress, error, uploadedImage, resetUpload } = useImageUpload();

  const handleUpload = async (file) => {
    const result = await uploadImage(file);
    if (result) {
      console.log('Image uploaded:', result);
    }
  };

  return (
    // Your component JSX
  );
}
```

#### Return Values:
- `uploadImage`: Function to upload an image file
- `uploading`: Boolean indicating upload status
- `progress`: Number (0-100) indicating upload progress
- `error`: String containing error message if any
- `uploadedImage`: Object containing uploaded image data
- `resetUpload`: Function to reset upload state
- `validateFile`: Function to validate a file before upload

## Components

### VideoUpload

A complete video upload component with drag-and-drop functionality.

#### Props:
- `value`: Current video object (optional)
- `onChange`: Callback function called when video is uploaded
- `className`: Additional CSS classes (optional)
- `maxSize`: Maximum file size in bytes (default: 50MB)
- `disabled`: Disable the component (default: false)

#### Features:
- Drag and drop interface
- File validation
- Progress tracking
- Video preview
- Error handling
- Responsive design

#### Usage:
```jsx
import VideoUpload from '@/components/upload/VideoUpload';

function CourseForm() {
  const [video, setVideo] = useState(null);

  return (
    <VideoUpload
      value={video}
      onChange={setVideo}
      maxSize={100 * 1024 * 1024} // 100MB
    />
  );
}
```

### ImageUpload

A complete image upload component with drag-and-drop functionality.

#### Props:
- `value`: Current image object (optional)
- `onChange`: Callback function called when image is uploaded
- `className`: Additional CSS classes (optional)
- `maxSize`: Maximum file size in bytes (default: 10MB)
- `disabled`: Disable the component (default: false)
- `aspectRatio`: Aspect ratio constraint ('free', 'square', '16:9', '4:3')

#### Features:
- Drag and drop interface
- File validation
- Progress tracking
- Image preview
- Aspect ratio options
- Error handling
- Responsive design

#### Usage:
```jsx
import ImageUpload from '@/components/upload/ImageUpload';

function CourseForm() {
  const [image, setImage] = useState(null);

  return (
    <ImageUpload
      value={image}
      onChange={setImage}
      aspectRatio="16:9"
    />
  );
}
```

### UploadProgress

A reusable progress component for displaying upload status.

#### Props:
- `progress`: Upload progress (0-100)
- `status`: Upload status ('uploading', 'completed', 'error')
- `fileName`: Name of the file being uploaded (optional)
- `fileSize`: Size of the file in bytes (optional)
- `error`: Error message (optional)
- `onCancel`: Cancel callback function (optional)
- `className`: Additional CSS classes (optional)
- `showFileName`: Show file name (default: true)
- `showFileSize`: Show file size (default: true)

#### Variants:
- `VideoUploadProgress`: Themed for video uploads
- `ImageUploadProgress`: Themed for image uploads
- `DocumentUploadProgress`: Themed for document uploads

#### Usage:
```jsx
import UploadProgress, { VideoUploadProgress } from '@/components/upload/UploadProgress';

function MyComponent() {
  return (
    <UploadProgress
      progress={75}
      status="uploading"
      fileName="my-video.mp4"
      fileSize={1024 * 1024 * 50} // 50MB
      onCancel={() => console.log('Cancelled')}
    />
  );
}
```

## Cloudinary Setup

### Required Upload Presets

You need to create the following upload presets in your Cloudinary dashboard:

1. **video_preset**: For video uploads
   - Resource type: Video
   - Folder: course-flow/videos
   - Allowed formats: mp4, mov, avi, mkv, webm

2. **image_preset**: For image uploads
   - Resource type: Image
   - Folder: course-flow/images
   - Allowed formats: jpg, jpeg, png, gif, webp, svg

### Folder Structure

The upload system organizes files in the following folder structure:

```
course-flow/
├── videos/
│   ├── [video-file-1].mp4
│   └── [video-file-2].mov
└── images/
    ├── [image-file-1].jpg
    └── [image-file-2].png
```

## Response Data Structure

### Video Upload Response

```javascript
{
  public_id: "course-flow/videos/video_abc123",
  secure_url: "https://res.cloudinary.com/cloud_name/video/upload/v1234567890/course-flow/videos/video_abc123.mp4",
  format: "mp4",
  size: 52428800, // bytes
  duration: 120.5, // seconds
  width: 1920,
  height: 1080,
  created_at: "2024-01-01T12:00:00Z"
}
```

### Image Upload Response

```javascript
{
  public_id: "course-flow/images/image_xyz789",
  secure_url: "https://res.cloudinary.com/cloud_name/image/upload/v1234567890/course-flow/images/image_xyz789.jpg",
  format: "jpg",
  size: 1048576, // bytes
  width: 1920,
  height: 1080,
  created_at: "2024-01-01T12:00:00Z"
}
```

## Error Handling

The upload system handles various error scenarios:

- **File size exceeded**: Shows error with maximum allowed size
- **Invalid format**: Shows error with supported formats
- **Network errors**: Shows generic upload failed message
- **Cloudinary errors**: Displays specific error messages from Cloudinary

## Best Practices

1. **File Size Limits**: Set appropriate file size limits based on your Cloudinary plan
2. **Format Validation**: Always validate file formats on both client and server side
3. **Progress Feedback**: Provide clear progress indication to users
4. **Error Recovery**: Implement retry mechanisms for failed uploads
5. **Cleanup**: Properly cleanup object URLs and event listeners
6. **Accessibility**: Ensure components are keyboard accessible and screen reader friendly

## Integration Examples

### Course Creation Form

```jsx
import { useState } from 'react';
import VideoUpload from '@/components/upload/VideoUpload';
import ImageUpload from '@/components/upload/ImageUpload';

function CourseCreationForm() {
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    thumbnail: null,
    trailer: null
  });

  return (
    <form className="space-y-6">
      {/* Other form fields */}
      
      <div>
        <label className="block text-sm font-medium mb-2">Course Thumbnail</label>
        <ImageUpload
          value={courseData.thumbnail}
          onChange={(image) => setCourseData(prev => ({ ...prev, thumbnail: image }))}
          aspectRatio="16:9"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Course Trailer</label>
        <VideoUpload
          value={courseData.trailer}
          onChange={(video) => setCourseData(prev => ({ ...prev, trailer: video }))}
        />
      </div>
    </form>
  );
}
```

## Troubleshooting

### Common Issues

1. **Upload fails with 401 error**
   - Check Cloudinary API credentials
   - Verify upload preset exists and is unsigned

2. **File size too large**
   - Check Cloudinary account limits
   - Verify maxSize prop is set correctly

3. **CORS errors**
   - Ensure Cloudinary CORS settings allow your domain
   - Check that you're using HTTPS in production

4. **Upload preset not found**
   - Create the required upload presets in Cloudinary dashboard
   - Verify preset names match exactly

### Debug Mode

To enable debug logging, add this to your environment:

```env
NEXT_PUBLIC_DEBUG_UPLOAD=true
```

This will provide detailed console logs during the upload process.

## Dependencies

The upload system requires the following packages:

```json
{
  "dependencies": {
    "react-dropzone": "^15.0.0",
    "cloudinary": "^2.9.0",
    "lucide-react": "^0.574.0"
  }
}
```

Ensure these are installed in your project before using the upload components.
