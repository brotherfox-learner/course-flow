# 🧪 Testing Guide for Admin Features

**Branch:** `feature/admin-login`  
**Date:** 10 มีนาคม 2026  
**Status:** 🟡 READY FOR TESTING

---

## 🚀 **Quick Start**

```bash
# 1. Start development server
npm run dev

# 2. Open browser
http://localhost:3000

# 3. Test in this order
1. Admin Role Redirect
2. Upload System
3. CRUD Operations
4. Pagination
```

---

## 📋 **Testing Checklist**

### ✅ **1. Admin Role Redirect Testing**

#### **Test Case 1: Admin Login**
```
URL: http://localhost:3000/admin/login
Steps:
1. Login with admin credentials
Expected: Redirect to /admin/courses
```

#### **Test Case 2: Non-Admin Login**
```
URL: http://localhost:3000/admin/login
Steps:
1. Login with regular user credentials
Expected: Redirect to / (homepage)
```

#### **Test Case 3: Direct Access**
```
URL: http://localhost:3000/admin/login (already logged in as non-admin)
Expected: Show "Access Denied" page
```

---

### ✅ **2. Upload System Testing**

#### **Video Upload Test**
```
Page: /admin/courses/add
Component: VideoUpload
Steps:
1. Drag & drop video file (.mp4, .mov, .avi, .webm)
2. Check progress bar
3. Verify preview shows
4. Check form data includes video URL
Expected: Upload success with Cloudinary URL
```

#### **Image Upload Test**
```
Page: /admin/courses/add
Steps:
1. Enter image URL in cover image field
2. Try to upload image (if component available)
Expected: Image URL saved correctly
```

---

### ✅ **3. Course CRUD Testing**

#### **Create Course Test**
```
Page: /admin/courses/add
Steps:
1. Fill all required fields:
   - Course name
   - Price
   - Total learning time
   - Course summary
   - Course detail
   - Cover image URL
   - Video trailer (upload or URL)
2. Click "Create"
Expected: Redirect to course edit page
```

#### **List Courses Test**
```
Page: /admin/courses
Steps:
1. Check course listing appears
2. Test pagination (click page 2, 3)
3. Test search functionality
Expected: Courses load with pagination
```

#### **Edit Course Test**
```
Page: /admin/courses/[id]
Steps:
1. Click "Edit" on any course
2. Modify some fields
3. Click "Update"
Expected: Course updated successfully
```

#### **Delete Course Test**
```
Page: /admin/courses/[id]
Steps:
1. Click "Delete" on any course
2. Confirm in dialog
Expected: Course deleted, redirect to listing
```

---

### ✅ **4. Lesson/Sublesson CRUD Testing**

#### **Create Lesson Test**
```
Page: /admin/courses/[id]
Steps:
1. Click "+ Add Lesson"
2. Fill lesson details
3. Upload lesson video
4. Save lesson
Expected: Lesson created successfully
```

#### **Create Sublesson Test**
```
Page: /admin/courses/[id]
Steps:
1. Click "+ Add Sublesson" under a lesson
2. Fill sublesson details
3. Upload sublesson video
4. Save sublesson
Expected: Sublesson created successfully
```

---

### ✅ **5. Promo Code CRUD Testing**

#### **List Promo Codes Test**
```
Page: /admin/promocodes
Steps:
1. Check promo code listing
2. Verify status (active/expired/inactive)
3. Check used count
Expected: Promo codes load correctly
```

#### **Create Promo Code Test**
```
Page: /admin/promocodes/add
Steps:
1. Fill promo code details:
   - Code
   - Name
   - Discount type (THB/%)
   - Discount value
   - Min purchase amount
   - Valid dates
2. Click "Create"
Expected: Promo code created successfully
```

---

### ✅ **6. Pagination Testing**

#### **Admin Courses Pagination**
```
Page: /admin/courses
Steps:
1. Check pagination controls appear
2. Click different page numbers
3. Verify URL updates (?page=2)
4. Test with search results
Expected: Smooth pagination with correct data
```

---

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **Upload Not Working**
```bash
# Check environment variables
CLOUDINARY_CLOUD_NAME=ddmjq5a4k
CLOUDINARY_API_KEY=567562931566656
CLOUDINARY_API_SECRET=UJptkwEU_6b5EqFdlpcRT_AoufM
```

#### **Authentication Issues**
```bash
# Check Supabase config
NEXT_PUBLIC_SUPABASE_URL=https://jwuksxgnedlqnxzcbawp.supabase.co/
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_[KEY]
SUPABASE_SERVICE_ROLE_KEY=sb_secret_[KEY]
```

#### **Database Connection**
```bash
# Check PostgreSQL connection
CONNECTION_STRING=postgresql://postgres.jwuksxgnedlqnxzcbawp:wrc9q4w7aOSBV1BebUmIbSOXCnoNoum@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

---

## 📊 **Test Results Template**

### **Test Results:**
```
✅ Admin Role Redirect - PASS
✅ Video Upload - PASS
✅ Course Create - PASS
✅ Course List - PASS
✅ Course Edit - PASS
✅ Course Delete - PASS
✅ Lesson Create - PASS
✅ Sublesson Create - PASS
✅ Promo Code List - PASS
✅ Promo Code Create - PASS
✅ Pagination - PASS
```

### **Issues Found:**
```
🔴 [Issue Description]
   - Location: [File/Page]
   - Steps to Reproduce: [Steps]
   - Expected: [Expected behavior]
   - Actual: [Actual behavior]
```

---

## 🎯 **Success Criteria**

### **Must Pass:**
- ✅ Admin role redirect works correctly
- ✅ Video upload to Cloudinary works
- ✅ Course CRUD operations complete
- ✅ Pagination functions properly
- ✅ Authentication and authorization work

### **Should Pass:**
- ✅ Lesson/Sublesson CRUD works
- ✅ Promo Code CRUD works
- ✅ Error handling displays properly
- ✅ Form validation works

### **Nice to Have:**
- ✅ Image upload works
- ✅ File attachments work
- ✅ Date picker functions

---

## 📝 **Notes for Developer**

### **What to Test First:**
1. **Start with admin login** - verify role checking
2. **Test upload system** - verify Cloudinary integration
3. **Test course creation** - verify database operations
4. **Test pagination** - verify performance

### **What to Check:**
- Network requests in browser dev tools
- Console errors
- API responses
- Database records
- Cloudinary uploads

### **When to Stop Testing:**
- All critical features work
- No major errors in console
- Database operations complete successfully
- Upload system works end-to-end

---

**🚀 Ready to test! Start with `npm run dev` and follow the checklist above.**
