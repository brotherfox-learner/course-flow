# Cloudinary Video Integration - Tutorial Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Cloudinary Setup](#cloudinary-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Application Setup](#application-setup)
6. [Testing the Integration](#testing-the-integration)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Features](#advanced-features)

## Getting Started

### Prerequisites
Before starting this tutorial, ensure you have:
- Node.js (v14 or higher)
- npm or yarn package manager
- Cloudinary account
- Supabase project
- Basic knowledge of React and Next.js

### Project Overview
This tutorial guides you through implementing a complete video upload system using Cloudinary in your Next.js course management application.

## Cloudinary Setup

### Step 1: Create Cloudinary Account

1. **Sign Up**
   - Visit [Cloudinary](https://cloudinary.com)
   - Click "Sign up for free"
   - Fill in your details and verify email

2. **Navigate to Dashboard**
   - After login, you'll see the main dashboard
   - Note your **Cloud Name** (displayed prominently)

### Step 2: Get API Credentials

1. **Find Your Credentials**
   ```
   Dashboard → Account Details
   ```
   
2. **Copy These Values**:
   - **Cloud Name**: `your-cloud-name`
   - **API Key**: `123456789012345`
   - **API Secret**: Click "View API Secret" to reveal

### Step 3: Configure Upload Preset (Optional)

1. **Create Upload Preset**
   ```
   Settings → Upload → Upload presets → Add upload preset
   ```

2. **Configure Settings**:
   - **Preset name**: `course-videos`
   - **Folder**: `course-videos`
   - **Resource type**: `Video`
   - **Allowed formats**: `mp4, mov, avi, mkv, webm`
   - **Max file size**: `50 MB`

3. **Save the preset**

## Environment Configuration

### Step 1: Create Environment File

Create `.env.local` in your project root:

```bash
touch .env.local
```

### Step 2: Add Configuration

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### Step 3: Security Check

Add `.env.local` to `.gitignore` if not already present:

```gitignore
# Environment variables
.env.local
.env
```

## Database Setup

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Click **New query**

### Step 2: Execute Schema Updates

```sql
-- Add video metadata columns to courses table
ALTER TABLE courses 
ADD COLUMN video_trailer_cloudinary_id TEXT,
ADD COLUMN video_trailer_duration INTEGER,
ADD COLUMN video_trailer_format VARCHAR(10),
ADD COLUMN video_trailer_size BIGINT;

-- Create index for better performance
CREATE INDEX idx_courses_video_cloudinary_id ON courses(video_trailer_cloudinary_id);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'courses' 
AND column_name LIKE 'video_trailer%';
```

### Step 3: Verify Schema

You should see these new columns:
- `video_trailer_cloudinary_id` (TEXT, nullable)
- `video_trailer_duration` (INTEGER, nullable)
- `video_trailer_format` (VARCHAR(10), nullable)
- `video_trailer_size` (BIGINT, nullable)

## Application Setup

### Step 1: Install Dependencies

```bash
npm install cloudinary react-dropzone @radix-ui/react-progress --legacy-peer-deps
```

### Step 2: Verify File Structure

Ensure these files exist in your project:

```
src/
├── components/
│   └── upload/
│       ├── VideoUpload.jsx
│       └── VideoPlayer.jsx
├── hooks/
│   └── useVideoUpload.js
├── lib/
│   └── cloudinary.js
├── pages/api/
│   └── upload/
│       └── video.js
└── pages/admin/courses/
    ├── add.jsx
    └── [id].jsx
```

### Step 3: Test Cloudinary Configuration

Create a test file to verify your setup:

```javascript
// test-cloudinary.js
const { v2 as cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Test connection
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error('Cloudinary connection failed:', error);
  } else {
    console.log('Cloudinary connection successful:', result);
  }
});
```

Run the test:
```bash
node test-cloudinary.js
```

## Testing the Integration

### Step 1: Start Development Server

```bash
npm run dev
```

### Step 2: Test Video Upload

1. **Navigate to Course Creation**
   - Go to `http://localhost:3000/admin/courses/add`
   - Log in with admin credentials

2. **Test Upload Functionality**
   - Fill in required course information
   - Scroll to "Video Trailer" section
   - Drag and drop a video file
   - Observe progress bar
   - Verify video preview appears

3. **Test Different File Types**
   - Try MP4, MOV, AVI files
   - Test file size validation (try >50MB file)
   - Test invalid file types

### Step 3: Test Course Creation

1. **Complete Course Form**
   - Fill all required fields
   - Upload a video trailer
   - Click "Create" button

2. **Verify Database**
   - Check Supabase database
   - Verify course record was created
   - Check video metadata fields

3. **Verify Cloudinary**
   - Check Cloudinary media library
   - Verify video was uploaded
   - Check folder structure

### Step 4: Test Video Playback

1. **View Course Details**
   - Navigate to course listing
   - Click on created course
   - Verify video player loads

2. **Test Player Controls**
   - Play/pause functionality
   - Volume controls
   - Seek bar
   - Fullscreen mode

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Upload Fails with Authentication Error

**Symptoms:**
- Error message: "Authentication failed"
- Upload progress stops at 0%

**Solutions:**
1. Check `.env.local` file exists
2. Verify Cloudinary credentials are correct
3. Ensure API secret has upload permissions
4. Restart development server

```bash
# Restart server after env changes
npm run dev
```

#### Issue 2: Video Not Playing

**Symptoms:**
- Video player shows but doesn't play
- Loading spinner continues indefinitely

**Solutions:**
1. Check video URL in database
2. Verify video exists in Cloudinary
3. Check video format compatibility
4. Test video in different browser

#### Issue 3: File Size Validation Not Working

**Symptoms:**
- Large files upload successfully
- No error message for oversized files

**Solutions:**
1. Check API endpoint validation
2. Verify client-side validation
3. Check Cloudinary preset limits
4. Update file size limits if needed

#### Issue 4: Database Errors

**Symptoms:**
- Course creation fails
- Database constraint errors

**Solutions:**
1. Verify database schema updates
2. Check column data types
3. Ensure proper permissions
4. Run migration scripts

### Debug Mode

Enable debug logging in Cloudinary:

```javascript
// In src/lib/cloudinary.js
cloudinary.config({
  // ... existing config
  debug: true, // Enable debug logging
});
```

### Log Monitoring

Check these locations for errors:
1. **Browser Console**: F12 → Console tab
2. **Network Tab**: Check upload requests
3. **Server Logs**: Terminal output
4. **Cloudinary Dashboard**: Usage and errors

## Advanced Features

### Feature 1: Video Thumbnails

Generate automatic thumbnails:

```javascript
// In cloudinary.js upload options
transformation: [
  { quality: 'auto:good' },
  { 
    width: 300, 
    height: 200, 
    crop: 'fill',
    format: 'jpg',
    fetch_format: 'auto'
  }
]
```

### Feature 2: Video Watermarking

Add watermark to uploaded videos:

```javascript
transformation: [
  {
    overlay: 'your_watermark_id',
    gravity: 'south_east',
    x: 20,
    y: 20
  }
]
```

### Feature 3: Adaptive Streaming

Enable HLS streaming for better performance:

```javascript
resource_type: 'video',
format: 'hls',
transformation: [
  { streaming_profile: 'full_hd_wifi' }
]
```

### Feature 4: Video Analytics

Track video performance:

```javascript
// Add to video player component
const onVideoPlay = () => {
  // Track analytics event
  analytics.track('video_play', {
    video_id: videoData.public_id,
    course_id: courseId
  });
};
```

## Performance Optimization

### Upload Optimization

1. **Chunked Uploads**
   ```javascript
   // Enable chunked upload for large files
   chunk_size: 6000000, // 6MB chunks
   ```
   
2. **Compression**
   ```javascript
   transformation: [
     { quality: 'auto:good' },
     { fetch_format: 'auto' }
   ]
   ```

### Playback Optimization

1. **Lazy Loading**
   ```javascript
   loading="lazy"
   preload="metadata"
   ```

2. **CDN Configuration**
   ```javascript
   // Use Cloudinary's CDN
   secure_url: result.secure_url
   ```

## Monitoring and Analytics

### Cloudinary Dashboard

1. **Storage Usage**
   - Monitor total storage
   - Track bandwidth usage
   - Set up alerts

2. **Performance Metrics**
   - Upload success rates
   - Transformation counts
   - Error rates

### Application Metrics

1. **Custom Analytics**
   ```javascript
   // Track upload events
   const trackUpload = (success, duration, fileSize) => {
     analytics.track('video_upload', {
       success,
       duration,
       fileSize,
       timestamp: new Date()
     });
   };
   ```

## Best Practices

### Security
1. Never expose API secrets to frontend
2. Use signed uploads for sensitive content
3. Implement rate limiting
4. Validate all file uploads

### Performance
1. Optimize video compression
2. Use CDN for delivery
3. Implement lazy loading
4. Monitor bandwidth usage

### User Experience
1. Show progress indicators
2. Provide clear error messages
3. Support drag-and-drop
4. Optimize for mobile devices

## Next Steps

### Immediate Actions
1. Configure production credentials
2. Set up monitoring
3. Test with real users
4. Deploy to staging

### Future Enhancements
1. Batch upload functionality
2. Video editing capabilities
3. Live streaming support
4. Advanced analytics

## Support Resources

### Documentation
- [Cloudinary Video Upload](https://cloudinary.com/documentation/video_upload)
- [React Dropzone](https://react-dropzone.js.org/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

### Community
- Cloudinary Discord Community
- Stack Overflow tags
- GitHub Issues

### Troubleshooting
- Cloudinary Support Portal
- Supabase Documentation
- React Community Forums

## Conclusion

You now have a complete, production-ready video upload system integrated with Cloudinary. The system includes:

- ✅ Secure video uploads
- ✅ Progress tracking
- ✅ Video playback
- ✅ Database integration
- ✅ Error handling
- ✅ Mobile optimization

The implementation is ready for production use with proper configuration and testing.
