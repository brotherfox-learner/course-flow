# Cloudinary Video Integration - คู่มือการใช้งาน

## สารบัญ
1. [เริ่มต้นใช้งาน](#เริ่มต้นใช้งาน)
2. [การตั้งค่า Cloudinary](#การตั้งค่า-cloudinary)
3. [การตั้งค่า Environment](#การตั้งค่า-environment)
4. [การตั้งค่าฐานข้อมูล](#การตั้งค่าฐานข้อมูล)
5. [การตั้งค่าแอปพลิเคชัน](#การตั้งค่าแอปพลิเคชัน)
6. [การทดสอบการเชื่อมต่อ](#การทดสอบการเชื่อมต่อ)
7. [การแก้ไขปัญหา](#การแก้ไขปัญหา)
8. [ฟีเจอร์ขั้นสูง](#ฟีเจอร์ขั้นสูง)

## เริ่มต้นใช้งาน

### สิ่งที่ต้องเตรียม
ก่อนเริ่มบทช่วยสอนนี้ ให้แน่ใจว่าคุณมี:
- Node.js (เวอร์ชัน 14 ขึ้นไป)
- npm หรือ yarn package manager
- บัญชี Cloudinary
- โปรเจกต์ Supabase
- ความรู้พื้นฐานเกี่ยวกับ React และ Next.js

### ภาพรวมโปรเจกต์
บทช่วยสอนนี้จะแนะนำคุณในการสร้างระบบอัปโหลดวิดีโอที่สมบูรณ์โดยใช้ Cloudinary ในแอปพลิเคชันจัดการคอร์ส Next.js ของคุณ

## การตั้งค่า Cloudinary

### ขั้นตอนที่ 1: สร้างบัญชี Cloudinary

1. **สมัครสมาชิก**
   - เข้าไปที่ [Cloudinary](https://cloudinary.com)
   - คลิก "Sign up for free"
   - กรอกข้อมูลและยืนยันอีเมล

2. **ไปที่แดชบอร์ด**
   - หลังจากล็อกอิน คุณจะเห็นหน้าแดชบอร์ดหลัก
   - จดบันทึก **Cloud Name** ของคุณ (แสดงอยู่อย่างเด่นชัด)

### ขั้นตอนที่ 2: รับข้อมูลรับรอง API

1. **ค้นหาข้อมูลรับรองของคุณ**
   ```
   แดชบอร์ด → รายละเอียดบัญชี
   ```
   
2. **คัดลอกค่าเหล่านี้**:
   - **Cloud Name**: `your-cloud-name`
   - **API Key**: `123456789012345`
   - **API Secret**: คลิก "View API Secret" เพื่อแสดง

### ขั้นตอนที่ 3: ตั้งค่า Upload Preset (ไม่บังคับ)

1. **สร้าง Upload Preset**
   ```
   การตั้งค่า → อัปโหลด → Upload presets → เพิ่ม upload preset
   ```

2. **ตั้งค่า**:
   - **ชื่อ Preset**: `course-videos`
   - **โฟลเดอร์**: `course-videos`
   - **ประเภททรัพยากร**: `วิดีโอ`
   - **รูปแบบที่อนุญาต**: `mp4, mov, avi, mkv, webm`
   - **ขนาดไฟล์สูงสุด**: `50 MB`

3. **บันทึก preset**

## การตั้งค่า Environment

### ขั้นตอนที่ 1: สร้างไฟล์ Environment

สร้าง `.env.local` ในรูทโปรเจกต์ของคุณ:

```bash
touch .env.local
```

### ขั้นตอนที่ 2: เพิ่มการตั้งค่า

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### ขั้นตอนที่ 3: ตรวจสอบความปลอดภัย

เพิ่ม `.env.local` ใน `.gitignore` หากยังไม่มี:

```gitignore
# Environment variables
.env.local
.env
```

## การตั้งค่าฐานข้อมูล

### ขั้นตอนที่ 1: เข้าถึง SQL Editor ของ Supabase

1. ไปที่โปรเจกต์ Supabase ของคุณ
2. นำทางไปยัง **SQL Editor**
3. คลิก **New query**

### ขั้นตอนที่ 2: ดำเนินการอัปเดต Schema

```sql
-- เพิ่มคอลัมน์ metadata ของวิดีโอในตาราง courses
ALTER TABLE courses 
ADD COLUMN video_trailer_cloudinary_id TEXT,
ADD COLUMN video_trailer_duration INTEGER,
ADD COLUMN video_trailer_format VARCHAR(10),
ADD COLUMN video_trailer_size BIGINT;

-- สร้าง index เพื่อประสิทธิภาพที่ดีขึ้น
CREATE INDEX idx_courses_video_cloudinary_id ON courses(video_trailer_cloudinary_id);

-- ตรวจสอบการเปลี่ยนแปลง
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'courses' 
AND column_name LIKE 'video_trailer%';
```

### ขั้นตอนที่ 3: ตรวจสอบ Schema

คุณควรเห็นคอลัมน์ใหม่เหล่านี้:
- `video_trailer_cloudinary_id` (TEXT, nullable)
- `video_trailer_duration` (INTEGER, nullable)
- `video_trailer_format` (VARCHAR(10), nullable)
- `video_trailer_size` (BIGINT, nullable)

## การตั้งค่าแอปพลิเคชัน

### ขั้นตอนที่ 1: ติดตั้ง Dependencies

```bash
npm install cloudinary react-dropzone @radix-ui/react-progress --legacy-peer-deps
```

### ขั้นตอนที่ 2: ตรวจสอบโครงสร้างไฟล์

ให้แน่ใจว่าไฟล์เหล่านี้มีอยู่ในโปรเจกต์ของคุณ:

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

### ขั้นตอนที่ 3: ทดสอบการตั้งค่า Cloudinary

สร้างไฟล์ทดสอบเพื่อตรวจสอบการตั้งค่าของคุณ:

```javascript
// test-cloudinary.js
const { v2 as cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ทดสอบการเชื่อมต่อ
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error('Cloudinary connection failed:', error);
  } else {
    console.log('Cloudinary connection successful:', result);
  }
});
```

รันการทดสอบ:
```bash
node test-cloudinary.js
```

## การทดสอบการเชื่อมต่อ

### ขั้นตอนที่ 1: เริ่มต้น Development Server

```bash
npm run dev
```

### ขั้นตอนที่ 2: ทดสอบการอัปโหลดวิดีโอ

1. **ไปที่การสร้างคอร์ส**
   - ไปที่ `http://localhost:3000/admin/courses/add`
   - ล็อกอินด้วยข้อมูลผู้ดูแลระบบ

2. **ทดสอบฟังก์ชันการอัปโหลด**
   - กรอกข้อมูลคอร์สที่จำเป็น
   - เลื่อนไปที่ส่วน "Video Trailer"
   - ลากและวางไฟล์วิดีโอ
   - สังเกตแถบความคืบหน้า
   - ตรวจสอบให้แน่ใจว่ามีการแสดงตัวอย่างวิดีโอ

3. **ทดสอบประเภทไฟล์ต่างๆ**
   - ลองไฟล์ MP4, MOV, AVI
   - ทดสอบการตรวจสอบขนาดไฟล์ (ลองไฟล์ >50MB)
   - ทดสอบประเภทไฟล์ที่ไม่ถูกต้อง

### ขั้นตอนที่ 3: ทดสอบการสร้างคอร์ส

1. **กรอกแบบฟอร์มคอร์ส**
   - กรอกฟิลด์ที่จำเป็นทั้งหมด
   - อัปโหลดวิดีโอ trailer
   - คลิกปุ่ม "Create"

2. **ตรวจสอบฐานข้อมูล**
   - ตรวจสอบฐานข้อมูล Supabase
   - ตรวจสอบว่ามีการสร้างระเบียนคอร์ส
   - ตรวจสอบฟิลด์ metadata ของวิดีโอ

3. **ตรวจสอบ Cloudinary**
   - ตรวจสอบไลบรารีสื่อ Cloudinary
   - ตรวจสอบว่ามีการอัปโหลดวิดีโอ
   - ตรวจสอบโครงสร้างโฟลเดอร์

### ขั้นตอนที่ 4: ทดสอบการเล่นวิดีโอ

1. **ดูรายละเอียดคอร์ส**
   - นำทางไปยังรายการคอร์ส
   - คลิกที่คอร์สที่สร้าง
   - ตรวจสอบว่าโปรแกรมเล่นวิดีโอโหลด

2. **ทดสอบการควบคุมโปรแกรมเล่น**
   - ฟังก์ชันเล่น/หยุดชั่วคราว
   - การควบคุมระดับเสียง
   - แถบค้นหา
   - โหมดเต็มหน้าจอ

## การแก้ไขปัญหา

### ปัญหาทั่วไปและวิธีแก้ไข

#### ปัญหาที่ 1: อัปโหลดล้มเหลวด้วยข้อผิดพลาดการยืนยันตัวตน

**อาการ:**
- ข้อความแสดงข้อผิดพลาด: "Authentication failed"
- ความคืบหน้าการอัปโหลดหยุดที่ 0%

**วิธีแก้ไข:**
1. ตรวจสอบว่ามีไฟล์ `.env.local`
2. ตรวจสอบว่าข้อมูลรับรอง Cloudinary ถูกต้อง
3. ให้แน่ใจว่า API secret มีสิทธิ์ในการอัปโหลด
4. รีสตาร์ท development server

```bash
# รีสตาร์ท server หลังจากเปลี่ยน env
npm run dev
```

#### ปัญหาที่ 2: วิดีโอไม่เล่น

**อาการ:**
- โปรแกรมเล่นวิดีโอแสดงแต่ไม่เล่น
- สปินเนอร์โหลดดำเนินการต่อเนื่อง

**วิธีแก้ไข:**
1. ตรวจสอบ URL วิดีโอในฐานข้อมูล
2. ตรวจสอบว่ามีวิดีโอใน Cloudinary
3. ตรวจสอบความเข้ากันได้ของรูปแบบวิดีโอ
4. ทดสอบวิดีโอในเบราว์เซอร์อื่น

#### ปัญหาที่ 3: การตรวจสอบขนาดไฟล์ไม่ทำงาน

**อาการ:**
- ไฟล์ขนาดใหญ่อัปโหลดสำเร็จ
- ไม่มีข้อความแสดงข้อผิดพลาดสำหรับไฟล์ขนาดใหญ่

**วิธีแก้ไข:**
1. ตรวจสอบการตรวจสอบ API endpoint
2. ตรวจสอบการตรวจสอบฝั่งไคลเอนต์
3. ตรวจสอบขีดจำกัด Cloudinary preset
4. อัปเดตขีดจำกัดขนาดไฟล์หากจำเป็น

#### ปัญหาที่ 4: ข้อผิดพลาดฐานข้อมูล

**อาการ:**
- การสร้างคอร์สล้มเหลว
- ข้อผิดพลาดข้อจำกัดฐานข้อมูล

**วิธีแก้ไข:**
1. ตรวจสอบการอัปเดต schema ฐานข้อมูล
2. ตรวจสอบประเภทข้อมูลคอลัมน์
3. ให้แน่ใจว่ามีสิทธิ์ที่เหมาะสม
4. รันสคริปต์ migration

### โหมดดีบัก

เปิดการบันทึกการดีบักใน Cloudinary:

```javascript
// ใน src/lib/cloudinary.js
cloudinary.config({
  // ... config ที่มีอยู่
  debug: true, // เปิดใช้งานการบันทึกการดีบัก
});
```

### การตรวจสอบ Log

ตรวจสอบตำแหน่งเหล่านี้สำหรับข้อผิดพลาด:
1. **คอนโซลเบราว์เซอร์**: F12 → แท็บคอนโซล
2. **แท็บเครือข่าย**: ตรวจสอบคำขออัปโหลด
3. **Server Logs**: ผลลัพธ์เทอร์มินัล
4. **แดชบอร์ด Cloudinary**: การใช้งานและข้อผิดพลาด

## ฟีเจอร์ขั้นสูง

### ฟีเจอร์ที่ 1: ภาพขนาดย่อวิดีโอ

สร้างภาพขนาดย่ออัตโนมัติ:

```javascript
// ในตัวเลือกการอัปโหลด cloudinary.js
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

### ฟีเจอร์ที่ 2: การใส่ลายน้ำวิดีโอ

เพิ่มลายน้ำให้กับวิดีโอที่อัปโหลด:

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

### ฟีเจอร์ที่ 3: Adaptive Streaming

เปิดใช้งาน HLS streaming เพื่อประสิทธิภาพที่ดีขึ้น:

```javascript
resource_type: 'video',
format: 'hls',
transformation: [
  { streaming_profile: 'full_hd_wifi' }
]
```

### ฟีเจอร์ที่ 4: วิเคราะห์วิดีโอ

ติดตามประสิทธิภาพวิดีโอ:

```javascript
// เพิ่มในคอมโพเนนต์โปรแกรมเล่นวิดีโอ
const onVideoPlay = () => {
  // ติดตามเหตุการณ์วิเคราะห์
  analytics.track('video_play', {
    video_id: videoData.public_id,
    course_id: courseId
  });
};
```

## การปรับปรุงประสิทธิภาพ

### การปรับปรุงการอัปโหลด

1. **การอัปโหลดแบบส่วน**
   ```javascript
   // เปิดใช้งานการอัปโหลดแบบส่วนสำหรับไฟล์ขนาดใหญ่
   chunk_size: 6000000, // ชิ้น 6MB
   ```
   
2. **การบีบอัด**
   ```javascript
   transformation: [
     { quality: 'auto:good' },
     { fetch_format: 'auto' }
   ]
   ```

### การปรับปรุงการเล่น

1. **Lazy Loading**
   ```javascript
   loading="lazy"
   preload="metadata"
   ```

2. **การตั้งค่า CDN**
   ```javascript
   // ใช้ CDN ของ Cloudinary
   secure_url: result.secure_url
   ```

## การตรวจสอบและวิเคราะห์

### แดชบอร์ด Cloudinary

1. **การใช้งานพื้นที่เก็บข้อมูล**
   - ตรวจสอบพื้นที่เก็บข้อมูลทั้งหมด
   - ติดตามการใช้งานแบนด์วิดท์
   - ตั้งค่าการแจ้งเตือน

2. **ตัวชี้วัดประสิทธิภาพ**
   - อัตราความสำเร็จในการอัปโหลด
   - จำนวนการแปลง
   - อัตราข้อผิดพลาด

### ตัวชี้วัดแอปพลิเคชัน

1. **การวิเคราะห์แบบกำหนดเอง**
   ```javascript
   // ติดตามเหตุการณ์การอัปโหลด
   const trackUpload = (success, duration, fileSize) => {
     analytics.track('video_upload', {
       success,
       duration,
       fileSize,
       timestamp: new Date()
     });
   };
   ```

## แนวปฏิบัติที่ดีที่สุด

### ความปลอดภัย
1. ไม่เปิดเผย API secrets ให้ frontend
2. ใช้การอัปโหลดที่ลงนามสำหรับเนื้อหาที่ละเอียดอ่อน
3. ใช้งานการจำกัดอัตรา
4. ตรวจสอบการอัปโหลดไฟล์ทั้งหมด

### ประสิทธิภาพ
1. ปรับให้เหมาะสมกับการบีบอัดวิดีโอ
2. ใช้ CDN สำหรับการจัดส่ง
3. ใช้งาน lazy loading
4. ตรวจสอบการใช้งานแบนด์วิดท์

### ประสบการณ์ผู้ใช้
1. แสดงตัวบ่งชี้ความคืบหน้า
2. ให้ข้อความแสดงข้อผิดพลาดที่ชัดเจน
3. รองรับการลากและวาง
4. ปรับให้เหมาะสมกับอุปกรณ์มือถือ

## ขั้นตอนถัดไป

### การดำเนินการทันที
1. ตั้งค่าข้อมูลรับรองสำหรับการผลิต
2. ตั้งค่าการตรวจสอบ
3. ทดสอบกับผู้ใช้จริง
4. ปรับใช้กับสถานะ staging

### การปรับปรุงในอนาคต
1. ฟังก์ชันการอัปโหลดแบบกลุ่ม
2. ความสามารถในการแก้ไขวิดีโอ
3. การสนับสนุนการสตรีมมิงสด
4. การวิเคราะห์ขั้นสูง

## แหล่งข้อมูลสนับสนุน

### เอกสาร
- [Cloudinary Video Upload](https://cloudinary.com/documentation/video_upload)
- [React Dropzone](https://react-dropzone.js.org/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

### ชุมชน
- Cloudinary Discord Community
- Stack Overflow tags
- GitHub Issues

### การแก้ไขปัญหา
- Cloudinary Support Portal
- Supabase Documentation
- React Community Forums

## บทสรุป

ตอนนี้คุณมีระบบอัปโหลดวิดีโอที่สมบูรณ์และพร้อมใช้งานในการผลิตที่เชื่อมต่อกับ Cloudinary ระบบประกอบด้วย:

- ✅ การอัปโหลดวิดีโอที่ปลอดภัย
- ✅ การติดตามความคืบหน้า
- ✅ การเล่นวิดีโอ
- ✅ การเชื่อมต่อฐานข้อมูล
- ✅ การจัดการข้อผิดพลาด
- ✅ การปรับให้เหมาะสมกับมือถือ

การใช้งานนี้พร้อมสำหรับการใช้งานในการผลิตด้วยการตั้งค่าและการทดสอบที่เหมาะสม
