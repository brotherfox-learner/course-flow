# 🧪 API Endpoints Testing Guide

**Branch:** `feature/admin-login`  
**Date:** 10 มีนาคม 2026  
**Status:** ✅ All 6 New Endpoints Created

---

## 📋 **New API Endpoints Created**

### ✅ **Upload APIs (Priority 1)**
1. **`POST /api/upload/image.js`** - Image upload to Cloudinary
2. **`DELETE /api/upload/delete.js`** - Delete files from Cloudinary

### ✅ **Admin List APIs (Priority 2)**
3. **`GET /api/admin/lessons/index.js`** - List lessons with pagination
4. **`GET /api/admin/sub-lessons/index.js`** - List sub-lessons with pagination

### ✅ **Promo Code Management APIs (Priority 3)**
5. **`GET/PUT/DELETE /api/admin/promocodes/[id].js`** - Single promo code CRUD
6. **`PUT /api/admin/promocodes/update.js`** - Update promo code

---

## 🧪 **Testing Commands**

### **Authentication Setup**
```bash
# Get admin token first (login via UI or use existing token)
TOKEN="your_admin_bearer_token"
BASE_URL="http://localhost:3000"
```

### **1. Test Image Upload**
```bash
curl -X POST "$BASE_URL/api/upload/image" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/image.jpg"

# Expected Response:
{
  "success": true,
  "url": "https://res.cloudinary.com/...",
  "data": {
    "public_id": "course-image-...",
    "secure_url": "https://res.cloudinary.com/...",
    "format": "jpg",
    "size": 123456,
    "width": 1920,
    "height": 1080
  },
  "message": "Image uploaded successfully"
}
```

### **2. Test File Delete**
```bash
curl -X DELETE "$BASE_URL/api/upload/delete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "public_id": "course-image-1234567890",
    "resource_type": "image"
  }'

# Expected Response:
{
  "success": true,
  "message": "File deleted successfully",
  "data": {
    "public_id": "course-image-1234567890",
    "cloudinary_result": { "result": "ok" },
    "database_updated": true
  }
}
```

### **3. Test Lessons List**
```bash
# Get all lessons
curl -X GET "$BASE_URL/api/admin/lessons" \
  -H "Authorization: Bearer $TOKEN"

# Get lessons with pagination
curl -X GET "$BASE_URL/api/admin/lessons?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"

# Filter by course_id
curl -X GET "$BASE_URL/api/admin/lessons?course_id=1" \
  -H "Authorization: Bearer $TOKEN"

# Search lessons
curl -X GET "$BASE_URL/api/admin/lessons?search=javascript" \
  -H "Authorization: Bearer $TOKEN"

# Expected Response:
{
  "lessons": [
    {
      "id": 1,
      "title": "Introduction to JavaScript",
      "description": "Learn the basics...",
      "video_url": "https://...",
      "video_cloudinary_id": "course-video-...",
      "video_duration": 1800,
      "lesson_order": 1,
      "created_at": "2026-03-10T...",
      "updated_at": "2026-03-10T...",
      "course_id": 1,
      "course_name": "JavaScript Fundamentals",
      "sublessons": 5
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

### **4. Test Sub-lessons List**
```bash
# Get all sub-lessons
curl -X GET "$BASE_URL/api/admin/sub-lessons" \
  -H "Authorization: Bearer $TOKEN"

# Filter by lesson_id
curl -X GET "$BASE_URL/api/admin/sub-lessons?lesson_id=1" \
  -H "Authorization: Bearer $TOKEN"

# Search sub-lessons
curl -X GET "$BASE_URL/api/admin/sub-lessons?search=variables" \
  -H "Authorization: Bearer $TOKEN"

# Expected Response:
{
  "subLessons": [
    {
      "id": 1,
      "title": "Variables and Data Types",
      "description": "Understanding variables...",
      "video_url": "https://...",
      "video_cloudinary_id": "course-video-...",
      "video_duration": 900,
      "sublesson_order": 1,
      "created_at": "2026-03-10T...",
      "updated_at": "2026-03-10T...",
      "lesson_id": 1,
      "lesson_title": "Introduction to JavaScript",
      "course_id": 1,
      "course_name": "JavaScript Fundamentals"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

### **5. Test Promo Code CRUD**

#### **Get Single Promo Code**
```bash
curl -X GET "$BASE_URL/api/admin/promocodes/1" \
  -H "Authorization: Bearer $TOKEN"

# Expected Response:
{
  "promoCode": {
    "id": 1,
    "code": "SAVE20",
    "name": "20% Discount",
    "discount_type": "percent",
    "discount_value": 20.00,
    "min_price": 100.00,
    "max_uses": 100,
    "valid_from": "2026-03-01T00:00:00Z",
    "valid_until": "2026-12-31T23:59:59Z",
    "status": "active",
    "used_count": 5
  }
}
```

#### **Update Promo Code (PUT /api/admin/promocodes/[id])**
```bash
curl -X PUT "$BASE_URL/api/admin/promocodes/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE25",
    "name": "25% Discount Updated",
    "discount_type": "percent",
    "discount_value": 25,
    "min_price": 150,
    "max_uses": 150,
    "valid_from": "2026-03-15T00:00:00Z",
    "valid_until": "2026-12-31T23:59:59Z"
  }'
```

#### **Update Promo Code (PUT /api/admin/promocodes/update)**
```bash
curl -X PUT "$BASE_URL/api/admin/promocodes/update" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "code": "SAVE30",
    "name": "30% Discount",
    "discount_type": "percent",
    "discount_value": 30,
    "min_price": 200,
    "max_uses": 200
  }'
```

#### **Delete Promo Code**
```bash
curl -X DELETE "$BASE_URL/api/admin/promocodes/1" \
  -H "Authorization: Bearer $TOKEN"

# Expected Response:
{
  "message": "Promo code deleted successfully"
}
```

---

## 🔍 **Error Testing**

### **Test Authentication Errors**
```bash
# No token
curl -X GET "$BASE_URL/api/admin/lessons"
# Expected: 401 Unauthorized

# Invalid token
curl -X GET "$BASE_URL/api/admin/lessons" \
  -H "Authorization: Bearer invalid_token"
# Expected: 401 Unauthorized

# Non-admin token
curl -X GET "$BASE_URL/api/admin/lessons" \
  -H "Authorization: Bearer regular_user_token"
# Expected: 403 Forbidden
```

### **Test Validation Errors**
```bash
# Invalid file type for image upload
curl -X POST "$BASE_URL/api/upload/image" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/video.mp4"
# Expected: 400 Invalid file type

# Missing required fields for promo code
curl -X PUT "$BASE_URL/api/admin/promocodes/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
# Expected: 400 Missing required fields
```

---

## 📊 **Test Results Template**

### **API Testing Results:**
```
✅ POST /api/upload/image - PASS
✅ DELETE /api/upload/delete - PASS
✅ GET /api/admin/lessons - PASS
✅ GET /api/admin/sub-lessons - PASS
✅ GET /api/admin/promocodes/[id] - PASS
✅ PUT /api/admin/promocodes/[id] - PASS
✅ DELETE /api/admin/promocodes/[id] - PASS
✅ PUT /api/admin/promocodes/update - PASS
```

### **Issues Found:**
```
🔴 [API Name] - [Issue Description]
   - Endpoint: [URL]
   - Method: [GET/POST/PUT/DELETE]
   - Expected: [Expected behavior]
   - Actual: [Actual behavior]
   - Fix: [How to fix]
```

---

## 🎯 **Success Criteria**

### **Must Pass:**
- ✅ All APIs return correct HTTP status codes
- ✅ Authentication/authorization works properly
- ✅ Input validation prevents invalid data
- ✅ Pagination works correctly
- ✅ File upload/delete works with Cloudinary

### **Should Pass:**
- ✅ Error messages are descriptive
- ✅ Response formats are consistent
- ✅ Database operations complete successfully
- ✅ Search and filtering work

---

## 🚀 **Ready for Full System Testing**

**API Endpoints Status:** ✅ **100% Complete (39/39)**  
**New Endpoints:** ✅ **6/6 Created**  
**Testing Status:** 🟡 **Ready for Manual Testing**  

**Next Steps:**
1. Run `npm run dev`
2. Test each API with the commands above
3. Verify integration with frontend components
4. Test complete admin panel functionality

---

**🎯 All critical APIs are now complete and ready for testing!**
