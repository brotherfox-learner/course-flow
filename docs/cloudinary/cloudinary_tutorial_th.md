# คู่มือการผสานรวมวิดีโอ Cloudinary - ฉบับสอนสอนภาษาไทย

## สารบัญ
1. [เริ่มต้นใช้งาน](#เริ่มต้นใช้งาน)
2. [การตั้งค่า Cloudinary](#การตั้งค่า-cloudinary)
3. [การตั้งค่าสภาพแวดล้อม](#การตั้งค่าสภาพแวดล้อม)
4. [การตั้งค่าฐานข้อมูล](#การตั้งค่าฐานข้อมูล)
5. [การตั้งค่าแอปพลิเคชัน](#การตั้งค่าแอปพลิเคชัน)
6. [การทดสอบการผสานรวม](#การทดสอบการผสานรวม)
7. [การแก้ไขปัญหา](#การแก้ไขปัญหา)
8. [คุณสมบัติขั้นสูง](#คุณสมบัติขั้นสูง)

## เริ่มต้นใช้งาน

### ข้อกำหนดเบื้องต้น
ก่อนเริ่มคู่มือนี้ ให้แน่ใจว่าคุณมี:
- Node.js (v14 หรือสูงกว่า)
- npm หรือ yarn package manager
- บัญชี Cloudinary
- โปรเจค Supabase
- ความรู้พื้นฐานเกี่ยวกับ React และ Next.js

### ภาพรวมโปรเจค
คู่มือนี้จะแนะนำคุณตลอดกระบวนการนำไปใช้งานระบบอัปโหลดวิดีโอที่สมบูรณ์โดยใช้ Cloudinary ในแอปพลิเคชันจัดการคอร์ส Next.js ของคุณ

## การตั้งค่า Cloudinary

### ขั้นตอนที่ 1: สร้างบัญชี Cloudinary

1. **สมัครสมาชิก**
   - ไปที่ [Cloudinary](https://cloudinary.com)
   - คลิก "สมัครฟรี"
   - กรอกรายละเอียดและยืนยันอีเมล

2. **ไปที่แดชบอร์ด**
   - หลังจากเข้าสู่ระบบ คุณจะเห็นแดชบอร์ดหลัก
   - จด **Cloud Name** ของคุณไว้ (แสดงอย่างเด่นชัด)

### ขั้นตอนที่ 2: รับข้อมูลรับรอง API

1. **ค้นหาข้อมูลรับรองของคุณ**
   ```
   แดชบอร์ด → รายละเอียดบัญชี
   ```
   
2. **คัดลอกค่าเหล่านี้**:
   - **Cloud Name**: `your-cloud-name`
   - **API Key**: `123456789012345`
   - **API Secret**: คลิก "View API Secret" เพื่อแสดง

### ขั้นตอนที่ 3: ตั้งค่า Upload Preset (ไม่จำเป็นแต่แนะนำ)

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

## การตั้งค่าสภาพแวดล้อม

### ขั้นตอนที่ 1: สร้างไฟล์สภาพแวดล้อม

สร้าง `.env.local` ในรูทของโปรเจค:

```bash
touch .env.local
```

### ขั้นตอนที่ 2: เพิ่มการตั้งค่า

```env
# การตั้งค่า Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

# การตั้งค่า Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### ขั้นตอนที่ 3: การตรวจสอบความปลอดภัย

เพิ่ม `.env.local` ใน `.gitignore` หากยังไม่มี:

```gitignore
# ตัวแปรสภาพแวดล้อม
.env.local
.env
```

## การตั้งค่าฐานข้อมูล

### ขั้นตอนที่ 1: เข้าถึง SQL Editor ของ Supabase

1. ไปที่โปรเจค Supabase ของคุณ
2. ไปที่ **SQL Editor**
3. คลิก **New query**

### ขั้นตอนที่ 2: รันการอัปเดต Schema

```sql
-- เพิ่มคอลัมน์ข้อมูลเมตาวิดีโอ trailer ในตาราง courses
ALTER TABLE courses 
ADD COLUMN video_trailer_cloudinary_id TEXT,
ADD COLUMN video_trailer_duration INTEGER,
ADD COLUMN video_trailer_format VARCHAR(10),
ADD COLUMN video_trailer_size BIGINT;

-- สร้าง index สำหรับประสิทธิภาพที่ดีขึ้น
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

ตรวจให้แน่ใจว่าไฟล์เหล่านี้มีอยู่ในโปรเจคของคุณ:

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
    console.error('การเชื่อมต่อ Cloudinary ล้มเหลว:', error);
  } else {
    console.log('การเชื่อมต่อ Cloudinary สำเร็จ:', result);
  }
});
```

รันการทดสอบ:
```bash
node test-cloudinary.js
```

## การทดสอบการผสานรวม

### ขั้นตอนที่ 1: เริ่มเซิร์ฟเวอร์พัฒนา

```bash
npm run dev
```

### ขั้นตอนที่ 2: ทดสอบการอัปโหลดวิดีโอ

1. **ไปที่การสร้างคอร์ส**
   - ไปที่ `http://localhost:3000/admin/courses/add`
   - เข้าสู่ระบบด้วยข้อมูลผู้ดูแลระบบ

2. **ทดสอบฟังก์ชันอัปโหลด**
   - กรอกข้อมูลคอร์สที่จำเป็น
   - เลื่อนไปที่ส่วน "Video Trailer"
   - ลากและวางไฟล์วิดีโอ
   - สังเกตแถบความคืบหน้า
   - ตรวจสอบว่าพรีวิววิดีโอปรากฏขึ้น

3. **ทดสอบประเภทไฟล์ต่างๆ**
   - ลองไฟล์ MP4, MOV, AVI
   - ทดสอบไฟล์ขนาดใหญ่ (>50MB)
   - ทดสอบประเภทไฟล์ที่ไม่ถูกต้อง

### ขั้นตอนที่ 3: ทดสอบการสร้างคอร์ส

1. **กรอกแบบฟอร์มคอร์สให้สมบูรณ์**
   - กรอกฟิลด์ที่จำเป็นทั้งหมด
   - อัปโหลดวิดีโอ trailer
   - คลิกปุ่ม "สร้าง"

2. **ตรวจสอบฐานข้อมูล**
   - ตรวจสอบฐานข้อมูล Supabase
   - ตรวจสอบว่าบันทึกคอร์สถูกสร้าง
   - ตรวจสอบฟิลด์ข้อมูลเมตาวิดีโอ

3. **ตรวจสอบ Cloudinary**
   - ตรวจสอบไลบรารีสื่อ Cloudinary
   - ตรวจสอบว่าวิดีโอถูกอัปโหลด
   - ตรวจสอบโครงสร้างโฟลเดอร์

### ขั้นตอนที่ 4: ทดสอบการเล่นวิดีโอ

1. **ดูรายละเอียดคอร์ส**
   - ไปที่รายการคอร์ส
   - คลิกที่คอร์สที่สร้าง
   - ตรวจสอบว่าโปรแกรมเล่นวิดีโอโหลด

2. **ทดสอบคอนโทรลโปรแกรมเล่น**
   - ฟังก์ชัน play/pause
   - คอนโทรลเสียง
   - แถบค้นหา
   - โหมดเต็มหน้าจอ

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อยและวิธีแก้ไข

#### ปัญหา 1: การอัปโหลดล้มเหลวด้วยข้อผิดพลาดการตรวจสอบสิทธิ์

**อาการ:**
- ข้อความแสดงข้อผิดพลาด: "การตรวจสอบสิทธิ์ล้มเหลว"
- ความคืบหน้าการอัปโหลดหยุดที่ 0%

**วิธีแก้ไข:**
1. ตรวจสอบว่าไฟล์ `.env.local` มีอยู่
2. ตรวจสอบข้อมูลรับรอง Cloudinary ว่าถูกต้อง
3. ตรวจสอบว่า API secret มีสิทธิ์อัปโหลด
4. รีสตาร์ทเซิร์ฟเวอร์พัฒนา

```bash
# รีสตาร์ทเซิร์ฟเวอร์หลังการเปลี่ยนแปลง env
npm run dev
```

#### ปัญหา 2: วิดีโอไม่เล่น

**อาการ:**
- โปรแกรมเล่นวิดีโอแสดงแต่ไม่เล่น
- สปินเนอร์โหลดทำงานต่อเนื่อง

**วิธีแก้ไข:**
1. ตรวจสอบ URL วิดีโอในฐานข้อมูล
2. ตรวจสอบว่าวิดีโอมีอยู่ใน Cloudinary
3. ตรวจสอบความเข้ากันได้ของรูปแบบวิดีโอ
4. ทดสอบวิดีโอในเบราว์เซอร์อื่น

#### ปัญหา 3: การตรวจสอบขนาดไฟล์ไม่ทำงาน

**อาการ:**
- ไฟล์ขนาดใหญ่อัปโหลดสำเร็จ
- ไม่มีข้อความแสดงข้อผิดพลาดสำหรับไฟล์ขนาดใหญ่

**วิธีแก้ไข:**
1. ตรวจสอบการตรวจสอบ API endpoint
2. ตรวจสอบการตรวจสอบฝั่งไคลเอนต์
3. ตรวจสอบขีดจำกัด Cloudinary preset
4. อัปเดตขีดจำกัดขนาดไฟล์หากจำเป็น

#### ปัญหา 4: ข้อผิดพลาดฐานข้อมูล

**อาการ:**
- การสร้างคอร์สล้มเหลว
- ข้อผิดพลาด constraint ของฐานข้อมูล

**วิธีแก้ไข:**
1. ตรวจสอบการอัปเดต schema ฐานข้อมูล
2. ตรวจสอบประเภทข้อมูลคอลัมน์
3. ตรวจสอบสิทธิ์ที่เหมาะสม
4. รันสคริปต์ migration

### โหมด Debug

เปิดใช้งาน debug logging ใน Cloudinary:

```javascript
// ใน src/lib/cloudinary.js
cloudinary.config({
  // ... การตั้งค่าที่มีอยู่
  debug: true, // เปิดใช้งาน debug logging
});
```

### การตรวจสอบ Log

ตรวจสอบตำแหน่งเหล่านี้สำหรับข้อผิดพลาด:
1. **คอนโซลเบราว์เซอร์**: F12 → แท็บคอนโซล
2. **แท็บเครือข่าย**: ตรวจสอบคำขออัปโหลด
3. **Log เซิร์ฟเวอร์**: เอาต์พุตเทอร์มินัล
4. **แดชบอร์ด Cloudinary**: การใช้งานและข้อผิดพลาด

## คุณสมบัติขั้นสูง

### คุณสมบัติ 1: ภาพขนาดย่อวิดีโอ

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

### คุณสมบัติ 2: การใส่ลายน้ำวิดีโอ

เพิ่มลายน้ำให้วิดีโอที่อัปโหลด:

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

### คุณสมบัติ 3: Adaptive Streaming

เปิดใช้งาน HLS streaming สำหรับประสิทธิภาพที่ดีขึ้น:

```javascript
resource_type: 'video',
format: 'hls',
transformation: [
  { streaming_profile: 'full_hd_wifi' }
]
```

### คุณสมบัติ 4: การวิเคราะห์วิดีโอ

ติดตามประสิทธิภาพวิดีโอ:

```javascript
// เพิ่มในคอมโพเนนต์โปรแกรมเล่นวิดีโอ
const onVideoPlay = () => {
  // ติดตามเหตุการณ์การวิเคราะห์
  analytics.track('video_play', {
    video_id: videoData.public_id,
    course_id: courseId
  });
};
```

## การเพิ่มประสิทธิภาพ

### การเพิ่มประสิทธิภาพการอัปโหลด

1. **Chunked Uploads**
   ```javascript
   // เปิดใช้งาน chunked upload สำหรับไฟล์ขนาดใหญ่
   chunk_size: 6000000, // 6MB chunks
   ```
   
2. **การบีบอัด**
   ```javascript
   transformation: [
     { quality: 'auto:good' },
     { fetch_format: 'auto' }
   ]
   ```

### การเพิ่มประสิทธิภาพการเล่น

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

1. **การใช้พื้นที่จัดเก็บ**
   - ตรวจสอบพื้นที่จัดเก็บทั้งหมด
   - ติดตามการใช้ bandwidth
   - ตั้งค่าการแจ้งเตือน

2. **เมตริกประสิทธิภาพ**
   - อัตราความสำเร็จในการอัปโหลด
   - จำนวนการแปลง
   - อัตราข้อผิดพลาด

### เมตริกแอปพลิเคชัน

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

## แนวทางปฏิบัติที่ดีที่สุด

### ความปลอดภัย
1. ห้ามเปิดเผย API secrets ไปยัง frontend
2. ใช้ signed uploads สำหรับเนื้อหาที่ละเอียดอ่อน
3. ใช้งาน rate limiting
4. ตรวจสอบการอัปโหลดไฟล์ทั้งหมด

### ประสิทธิภาพ
1. เพิ่มประสิทธิภาพการบีบอัดวิดีโอ
2. ใช้ CDN สำหรับการจัดส่ง
3. ใช้งาน lazy loading
4. ตรวจสอบการใช้ bandwidth

### ประสบการณ์ผู้ใช้
1. แสดงตัวบ่งชี้ความคืบหน้า
2. ให้ข้อความแสดงข้อผิดพลาดที่ชัดเจน
3. รองรับ drag-and-drop
4. เพิ่มประสิทธิภาพสำหรับอุปกรณ์พกพา

## ขั้นตอนถัดไป

### การดำเนินการทันที
1. ตั้งค่าข้อมูลรับรอง production
2. ตั้งค่าการตรวจสอบ
3. ทดสอบกับผู้ใช้จริง
4. นำไปใช้งานใน staging

### การปรับปรุงในอนาคต
1. ฟังก์ชันการอัปโหลดแบบกลุ่ม
2. ความสามารถในการแก้ไขวิดีโอ
3. การสนับสนุนการสตรีมแบบสด
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

ตอนนี้คุณมีระบบอัปโหลดวิดีโอที่สมบูรณ์แบบซึ่งผสานรวมกับ Cloudinary แล้ว ระบบประกอบด้วย:

- ✅ การอัปโหลดวิดีโอที่ปลอดภัย
- ✅ การติดตามความคืบหน้า
- ✅ การเล่นวิดีโอ
- ✅ การผสานรวมฐานข้อมูล
- ✅ การจัดการข้อผิดพลาด
- ✅ การเพิ่มประสิทธิภาพสำหรับอุปกรณ์พกพา

การนำไปใช้งานพร้อมสำหรับการใช้งานจริงด้วยการตั้งค่าและการทดสอบที่เหมาะสม
