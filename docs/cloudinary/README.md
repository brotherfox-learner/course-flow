# Cloudinary Integration Documentation

## Overview
This folder contains comprehensive documentation for the Cloudinary video upload integration in the course-flow application.

## Available Documentation

### English Documentation
- **[setup_guide.md](./cloudinary_setup_guide.md)** - Complete setup guide for Cloudinary integration
- **[summary.md](./cloudinary_summary.md)** - Project summary and implementation overview  
- **[tutorial.md](./cloudinary_tutorial.md)** - Step-by-step tutorial with troubleshooting

### Thai Documentation  
- **[setup_guide_th.md](./cloudinary_setup_guide_th.md)** - คู่มือการตั้งค่า Cloudinary ฉบับภาษาไทย
- **[summary_th.md](./cloudinary_summary_th.md)** - สรุปโปรเจคและภาพรวมการนำไปใช้งาน
- **[tutorial_th.md](./cloudinary_tutorial_th.md)** - คู่มือสอนละเอียดภาษาไทย

## Quick Start

### 1. Get Cloudinary Credentials
1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Copy: Cloud Name, API Key, API Secret

### 2. Set Environment Variables
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Update Database
```sql
ALTER TABLE courses 
ADD COLUMN video_trailer_cloudinary_id TEXT,
ADD COLUMN video_trailer_duration INTEGER,
ADD COLUMN video_trailer_format VARCHAR(10),
ADD COLUMN video_trailer_size BIGINT;
```

### 4. Test Integration
```bash
npm run dev
# Visit: http://localhost:3000/admin/courses/add
```

## Implementation Status

✅ **Completed Features**
- Video upload with drag-and-drop interface
- Video player with custom controls
- Secure API endpoints with authentication
- Database integration for video metadata
- Course creation/editing integration
- Comprehensive error handling
- Mobile-responsive design

🔄 **Ready for Production**
- All components implemented and tested
- Documentation complete
- Security measures in place
- Performance optimizations applied

## File Structure
```
src/
├── components/upload/
│   ├── VideoUpload.jsx
│   └── VideoPlayer.jsx
├── hooks/useVideoUpload.js
├── lib/cloudinary.js
└── pages/api/upload/video.js
```

## Support
For issues or questions, refer to the troubleshooting section in the tutorial documentation.
