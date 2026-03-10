# คู่มือการติดตั้ง Cloudinary Video Integration - ฉบับภาษาไทย

## ภาพรวม
คู่มือนี้ครอบคลุมกระบวนการตั้งค่าการผสานรวมการอัปโหลดวิดีโอ Cloudinary ในแอปพลิเคชัน course-flow ทั้งหมด

## ข้อกำหนดเบื้องต้น
- บัญชี Cloudinary (มีฟรีแพลน)
- โปรเจค Supabase พร้อมสิทธิ์เข้าถึงฐานข้อมูล
- Node.js และ npm ที่ติดตั้งแล้ว

## ขั้นตอนที่ 1: การตั้งค่าบัญชี Cloudinary

### 1.1 สร้างบัญชี Cloudinary
1. ไปที่ [Cloudinary](https://cloudinary.com)
2. สมัครสมาชิกฟรี
3. ยืนยันอีเมลของคุณ

### 1.2 รับข้อมูลรับรอง Cloudinary
1. เข้าสู่ระบบที่ [Cloudinary Dashboard](https://cloudinary.com/console)
2. ในแดชบอร์ด ให้หาส่วน **รายละเอียดบัญชี**
3. คัดลอกค่าต่อไปนี้:
   - **Cloud Name**: ตัวระบุคลาวด์เฉพาะของคุณ
   - **API Key**: API key สาธารณะของคุณ
   - **API Secret**: คลิก "View API Secret" เพื่อแสดง

### 1.3 ตั้งค่า Upload Preset (แนะนำ)
1. ไปที่ **การตั้งค่า** → **อัปโหลด** → **Upload presets**
2. คลิก **เพิ่ม upload preset**
3. ตั้งค่าดังนี้:
   - **ชื่อ Preset**: `course-videos`
   - **โฟลเดอร์**: `course-videos`
   - **ประเภททรัพยากร**: `วิดีโอ`
   - **รูปแบบที่อนุญาต**: `mp4, mov, avi, mkv, webm`
   - **ขนาดไฟล์สูงสุด**: `50 MB`
   - **การแปลง**: 
     - คุณภาพ: `auto:good`
     - รูปแบบ: `auto`

## ขั้นตอนที่ 2: การตั้งค่าสภาพแวดล้อม

### 2.1 สร้างไฟล์สภาพแวดล้อม
สร้าง `.env.local` ในรูทของโปรเจค:

```env
# การตั้งค่า Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

# การตั้งค่า Supabase (ถ้ายังไม่ได้ตั้งค่า)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 2.2 ข้อควรระวังด้านความปลอดภัย
- ห้าม commit `.env.local` ไปยัง version control
- เพิ่ม `.env.local` ใน `.gitignore`
- เก็บ API secret ไว้อย่างปลอดภัยและไม่เปิดเผยต่อ frontend

## ขั้นตอนที่ 3: การอัปเดต Schema ฐานข้อมูล

### 3.1 เพิ่มคอลัมน์ข้อมูลเมตาวิดีโอ
รันคำสั่ง SQL เหล่านี้ในฐานข้อมูล Supabase ของคุณ:

```sql
-- เพิ่มคอลัมน์ข้อมูลเมตาวิดีโอ trailer ในตาราง courses
ALTER TABLE courses 
ADD COLUMN video_trailer_cloudinary_id TEXT,
ADD COLUMN video_trailer_duration INTEGER,
ADD COLUMN video_trailer_format VARCHAR(10),
ADD COLUMN video_trailer_size BIGINT;

-- สร้าง index สำหรับประสิทธิภาพที่ดีขึ้น
CREATE INDEX idx_courses_video_cloudinary_id ON courses(video_trailer_cloudinary_id);
```

### 3.2 ตรวจสอบ Schema
ตรวจให้แน่ใจว่าตาราง courses ของคุณมี:
- `video_trailer_cloudinary_id` (TEXT, nullable)
- `video_trailer_duration` (INTEGER, nullable)  
- `video_trailer_format` (VARCHAR(10), nullable)
- `video_trailer_size` (BIGINT, nullable)

## ขั้นตอนที่ 4: การตั้งค่าแอปพลิเคชัน

### 4.1 ติดตั้ง Dependencies
```bash
npm install cloudinary react-dropzone @radix-ui/react-progress --legacy-peer-deps
```

### 4.2 ตรวจสอบโครงสร้างไฟล์
ตรวจให้แน่ใจว่าไฟล์เหล่านี้มีอยู่:
- `src/lib/cloudinary.js` - การตั้งค่า Cloudinary
- `src/components/upload/VideoUpload.jsx` - คอมโพเนนต์อัปโหลด
- `src/components/upload/VideoPlayer.jsx` - โปรแกรมเล่นวิดีโอ
- `src/hooks/useVideoUpload.js` - hook สำหรับอัปโหลด
- `src/pages/api/upload/video.js` - API endpoint สำหรับอัปโหลด

## ขั้นตอนที่ 5: การทดสอบการผสานรวม

### 5.1 เริ่มเซิร์ฟเวอร์พัฒนา
```bash
npm run dev
```

### 5.2 ทดสอบการอัปโหลดวิดีโอ
1. ไปที่ `/admin/courses/add`
2. กรอกข้อมูลคอร์สที่จำเป็น
3. ทดสอบการอัปโหลดวิดีโอในส่วน "Video Trailer"
4. ตรวจสอบความคืบหน้าและฟังก์ชันพรีวิว

### 5.3 ทดสอบการเล่นวิดีโอ
1. สร้างคอร์สพร้อมวิดีโอที่อัปโหลด
2. ไปที่หน้ารายละเอียดคอร์ส
3. ตรวจสอบฟังก์ชันโปรแกรมเล่นวิดีโอ

## ขั้นตอนที่ 6: การพิจารณาสำหรับ Production

### 6.1 แพลน Cloudinary
- **ฟรีแพลน**: 25 เครดิต/เดือน (เพียงพอสำหรับการพัฒนา)
- **Growth Plan**: $89/เดือน สำหรับใช้งานจริง
- **Enterprise**: ราคาที่กำหนดเองสำหรับขนาดใหญ่

### 6.2 การเพิ่มประสิทธิภาพพื้นที่จัดเก็บ
- เปิดใช้งานการเพิ่มประสิทธิภาพรูปแบบอัตโนมัติ
- ใช้ adaptive bitrate streaming
- ใช้งาน CDN caching
- ตรวจสอบการใช้พื้นที่จัดเก็บ

### 6.3 ความปลอดภัย
- ใช้ signed uploads สำหรับความปลอดภัยเพิ่มเติม
- ใช้งาน rate limiting บน upload endpoints
- ตรวจสอบประเภทและขนาดไฟล์
- ตรวจสอบการใช้งานที่ไม่เหมาะสม

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

#### การอัปโหลดล้มเหลว
- ตรวจสอบข้อมูลรับรอง Cloudinary ใน `.env.local`
- ตรวจสอบว่า API key มีสิทธิ์อัปโหลด
- ตรวจสอบขีดจำกัดขนาดไฟล์ (50MB ตามค่าเริ่มต้น)

#### วิดีโอไม่เล่น
- ตรวจสอบว่า URL วิดีโอเข้าถึงได้
- ตรวจสอบความเข้ากันได้ของรูปแบบวิดีโอ
- ตรวจสอบว่า CORS ถูกตั้งค่าอย่างถูกต้อง

#### ข้อผิดพลาดฐานข้อมูล
- ตรวจสอบว่าคอลัมน์ที่จำเป็นมีอยู่ทั้งหมด
- ตรวจสอบสิทธิ์ฐานข้อมูล
- ตรวจสอบประเภทข้อมูลที่เหมาะสม

### โหมด Debug
เพิ่มนี้ในการตั้งค่า Cloudinary ของคุณเพื่อ debugging:
```javascript
// ใน src/lib/cloudinary.js
cloudinary.config({
  // ... การตั้งค่าที่มีอยู่
  debug: true, // เปิดใช้งาน debug logging
});
```

## การเพิ่มประสิทธิภาพ

### การเพิ่มประสิทธิภาพการอัปโหลด
- ใช้งาน chunked uploads สำหรับไฟล์ขนาดใหญ่
- เพิ่มตรรกะการลองใหม่ของอัปโหลด
- แสดงตัวบ่งชี้ความคืบหน้าแบบเรียลไทม์
- บีบอัดวิดีโอก่อนอัปโหลด

### การเพิ่มประสิทธิภาพการเล่น
- ใช้ adaptive streaming
- ใช้งาน lazy loading
- เพิ่มภาพขนาดย่อวิดีโอ
- เพิ่มประสิทธิภาพสำหรับอุปกรณ์พกพา

## การตรวจสอบและวิเคราะห์

### แดชบอร์ด Cloudinary
- ตรวจสอบการใช้พื้นที่จัดเก็บ
- ติดตามจำนวนการแปลง
- วิเคราะห์การใช้ bandwidth
- ตั้งค่าการแจ้งเตือนสำหรับขีดจำกัด

### เมตริกแอปพลิเคชัน
- ติดตามอัตราความสำเร็จของการอัปโหลด
- ตรวจสอบเวลาในการอัปโหลด
- บันทึกรูปแบบข้อผิดพลาด
- เมตริกการมีส่วนร่วมของผู้ใช้

## ขั้นตอนถัดไป

### 1. คุณสมบัติขั้นสูง
   - การสร้างภาพขนาดย่อวิดีโอ
   - การใส่ลายน้ำวิดีโอ
   - ความสามารถในการสตรีมแบบสด
   - การวิเคราะห์วิดีโอ

### 2. การปรับขนาด
   - ใช้งาน video CDN
   - เพิ่มการแปลงวิดีโอ
   - การปรับใช้หลายภูมิภาค
   - การทำ load balancing

### 3. ประสบการณ์ผู้ใช้
   - การปรับปรุง drag-and-drop
   - ฟังก์ชันการอัปโหลดแบบกลุ่ม
   - ความสามารถในการแก้ไขวิดีโอ
   - การเพิ่มประสิทธิภาพสำหรับอุปกรณ์พกพา

## แหล่งข้อมูลสนับสนุน

- [เอกสาร Cloudinary](https://cloudinary.com/documentation)
- [คู่มือการอัปโหลดวิดีโอ Cloudinary](https://cloudinary.com/documentation/video_upload)
- [เอกสาร React Dropzone](https://react-dropzone.js.org/)
- [เอกสาร Supabase](https://supabase.com/docs)

## สรุป

การตั้งค่านี้ให้โซลูชันการอัปโหลดวิดีโอที่สมบูรณ์ด้วย:
- ✅ การอัปโหลดวิดีโอที่ปลอดภัยไปยัง Cloudinary
- ✅ การติดตามความคืบหน้าและการจัดการข้อผิดพลาด
- ✅ การพรีวิวและการเล่นวิดีโอ
- ✅ การผสานรวมฐานข้อมูลกับข้อมูลเมตา
- ✅ การผสานรวมอินเทอร์เฟซผู้ดูแลระบบ
- ✅ การออกแบบที่ตอบสนองต่ออุปกรณ์พกพา
- ✅ การตั้งค่าที่พร้อมใช้งานจริง

ระบบพร้อมใช้งานจริงด้วยข้อมูลรับรอง Cloudinary ที่เหมาะสมและการอัปเดต schema ฐานข้อมูล
