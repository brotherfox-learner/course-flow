# Cloudinary Video Upload Integration - Setup Guide

## Overview
This guide covers the complete setup process for integrating Cloudinary video upload functionality into the course-flow application.

## Prerequisites
- Cloudinary account (Free tier available)
- Supabase project with database access
- Node.js and npm installed

## Step 1: Cloudinary Account Setup

### 1.1 Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

### 1.2 Get Cloudinary Credentials
1. Log in to [Cloudinary Dashboard](https://cloudinary.com/console)
2. In the dashboard, find your **Account Details**
3. Copy the following values:
   - **Cloud Name**: Your unique cloud identifier
   - **API Key**: Your public API key
   - **API Secret**: Click "View API Secret" to reveal

### 1.3 Configure Upload Preset (Optional but Recommended)
1. Navigate to **Settings** → **Upload** → **Upload presets**
2. Click **Add upload preset**
3. Configure with these settings:
   - **Preset name**: `course-videos`
   - **Folder**: `course-videos`
   - **Resource type**: `Video`
   - **Allowed formats**: `mp4, mov, avi, mkv, webm`
   - **Max file size**: `50 MB`
   - **Transformation**: 
     - Quality: `auto:good`
     - Format: `auto`

## Step 2: Environment Configuration

### 2.1 Create Environment File
Create `.env.local` in your project root:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 2.2 Security Notes
- Never commit `.env.local` to version control
- Add `.env.local` to `.gitignore`
- Keep API secret secure and never expose it to frontend

## Step 3: Database Schema Updates

### 3.1 Add Video Metadata Columns
Execute these SQL commands in your Supabase database:

```sql
-- Add video trailer metadata columns to courses table
ALTER TABLE courses 
ADD COLUMN video_trailer_cloudinary_id TEXT,
ADD COLUMN video_trailer_duration INTEGER,
ADD COLUMN video_trailer_format VARCHAR(10),
ADD COLUMN video_trailer_size BIGINT;

-- Create index for better performance
CREATE INDEX idx_courses_video_cloudinary_id ON courses(video_trailer_cloudinary_id);
```

### 3.2 Verify Schema
Ensure your courses table now includes:
- `video_trailer_cloudinary_id` (TEXT, nullable)
- `video_trailer_duration` (INTEGER, nullable)  
- `video_trailer_format` (VARCHAR(10), nullable)
- `video_trailer_size` (BIGINT, nullable)

## Step 4: Application Configuration

### 4.1 Install Dependencies
```bash
npm install cloudinary react-dropzone @radix-ui/react-progress --legacy-peer-deps
```

### 4.2 Verify File Structure
Ensure these files exist:
- `src/lib/cloudinary.js` - Cloudinary configuration
- `src/components/upload/VideoUpload.jsx` - Upload component
- `src/components/upload/VideoPlayer.jsx` - Video player
- `src/hooks/useVideoUpload.js` - Upload hook
- `src/pages/api/upload/video.js` - Upload API endpoint

## Step 5: Testing the Integration

### 5.1 Start Development Server
```bash
npm run dev
```

### 5.2 Test Video Upload
1. Navigate to `/admin/courses/add`
2. Fill in required course information
3. Test video upload in the "Video Trailer" section
4. Verify upload progress and preview functionality

### 5.3 Test Video Playback
1. Create a course with uploaded video
2. Navigate to course detail page
3. Verify video player functionality

## Step 6: Production Considerations

### 6.1 Cloudinary Plan
- **Free Tier**: 25 credits/month (sufficient for development)
- **Growth Plan**: $89/month for production use
- **Enterprise**: Custom pricing for large scale

### 6.2 Storage Optimization
- Enable auto-format optimization
- Use adaptive bitrate streaming
- Implement CDN caching
- Monitor storage usage

### 6.3 Security
- Use signed uploads for additional security
- Implement rate limiting on upload endpoints
- Validate file types and sizes
- Monitor for abuse

## Troubleshooting

### Common Issues

#### Upload Failures
- Check Cloudinary credentials in `.env.local`
- Verify API key has upload permissions
- Check file size limits (50MB default)

#### Video Not Playing
- Verify video URL is accessible
- Check video format compatibility
- Ensure CORS is properly configured

#### Database Errors
- Verify all required columns exist
- Check database permissions
- Ensure proper data types

### Debug Mode
Add this to your Cloudinary config for debugging:
```javascript
// In src/lib/cloudinary.js
cloudinary.config({
  // ... existing config
  debug: true, // Enable debug logging
});
```

## Performance Optimization

### Upload Optimization
- Implement chunked uploads for large files
- Add upload retry logic
- Show real-time progress indicators
- Compress videos before upload

### Playback Optimization
- Use adaptive streaming
- Implement lazy loading
- Add video thumbnails
- Optimize for mobile devices

## Monitoring and Analytics

### Cloudinary Dashboard
- Monitor storage usage
- Track transformation counts
- Analyze bandwidth usage
- Set up alerts for limits

### Application Metrics
- Track upload success rates
- Monitor upload times
- Log error patterns
- User engagement metrics

## Next Steps

1. **Advanced Features**:
   - Video thumbnails generation
   - Video watermarking
   - Live streaming capabilities
   - Video analytics

2. **Scaling**:
   - Implement video CDN
   - Add video transcoding
   - Multi-region deployment
   - Load balancing

3. **User Experience**:
   - Drag-and-drop improvements
   - Batch upload functionality
   - Video editing capabilities
   - Mobile optimization

## Support Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Video Upload Guide](https://cloudinary.com/documentation/video_upload)
- [React Dropzone Documentation](https://react-dropzone.js.org/)
- [Supabase Documentation](https://supabase.com/docs)

## Summary

This setup provides a complete video upload solution with:
- ✅ Secure video uploads to Cloudinary
- ✅ Progress tracking and error handling
- ✅ Video preview and playback
- ✅ Database integration with metadata
- ✅ Admin interface integration
- ✅ Mobile-responsive design
- ✅ Production-ready configuration

The system is now ready for production use with proper Cloudinary credentials and database schema updates.
