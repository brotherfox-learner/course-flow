import pool from "@/infrastructure/db"
import { createClient } from "@supabase/supabase-js"
import { deleteMultipleByUrl } from "@/infrastructure/cloudinary"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/*
ตรวจว่าเป็น admin
*/
async function ensureAdmin(req) {

  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "Unauthorized" }
  }

  const token = authHeader.split(" ")[1]

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { ok: false, status: 401, message: "Invalid token" }
  }

  const roleCheck = await pool.query(
    `SELECT role FROM users WHERE id = $1`,
    [user.id]
  )

  if (
    roleCheck.rows.length === 0 ||
    roleCheck.rows[0].role !== "admin"
  ) {
    return { ok: false, status: 403, message: "Forbidden" }
  }

  return { ok: true }
}

export default async function handler(req, res) {

  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const auth = await ensureAdmin(req)

  if (!auth.ok) {
    return res.status(auth.status).json({ message: auth.message })
  }

  const { course_id } = req.body

  if (!course_id) {
    return res.status(400).json({
      message: "course_id required"
    })
  }

  const client = await pool.connect()

  try {

    await client.query("BEGIN")

    /*
    0️⃣ Collect file URLs before deleting DB records
    */

    const courseRes = await client.query(
      `SELECT cover_img_url, vdo_trailer_url FROM courses WHERE id = $1`,
      [course_id]
    )
    const course = courseRes.rows[0]
    if (!course) {
      await client.query("ROLLBACK")
      return res.status(404).json({ message: "Course not found" })
    }

    const subLessonVideos = await client.query(
      `SELECT sl.vdo_url FROM sub_lessons sl
       JOIN lessons l ON sl.lesson_id = l.id
       WHERE l.course_id = $1 AND sl.vdo_url IS NOT NULL AND sl.vdo_url != ''`,
      [course_id]
    )

    const materialFiles = await client.query(
      `SELECT file_url FROM course_materials
       WHERE course_id = $1 AND file_url IS NOT NULL AND file_url != ''`,
      [course_id]
    )

    const cloudinaryUrls = [
      course.cover_img_url,
      course.vdo_trailer_url,
      ...subLessonVideos.rows.map(r => r.vdo_url),
    ].filter(Boolean)

    const supabaseStoragePaths = materialFiles.rows
      .map(r => r.file_url)
      .filter(Boolean)
      .map(url => {
        try {
          const u = new URL(url)
          const match = u.pathname.match(/\/storage\/v1\/object\/public\/course-materials\/(.+)/)
          return match ? match[1] : null
        } catch { return null }
      })
      .filter(Boolean)

    /*
    1️⃣ ลบ assignment chain
    */

    await client.query(
      `DELETE FROM submission_selected_options WHERE submission_answer_id IN (
        SELECT sa.id FROM submission_answers sa
        JOIN assignment_submissions asub ON sa.submission_id = asub.id
        JOIN assignments a ON asub.assignment_id = a.id
        JOIN sub_lessons sl ON a.sub_lesson_id = sl.id
        JOIN lessons l ON sl.lesson_id = l.id
        WHERE l.course_id = $1
      )`, [course_id]
    )
    await client.query(
      `DELETE FROM submission_answers WHERE submission_id IN (
        SELECT asub.id FROM assignment_submissions asub
        JOIN assignments a ON asub.assignment_id = a.id
        JOIN sub_lessons sl ON a.sub_lesson_id = sl.id
        JOIN lessons l ON sl.lesson_id = l.id
        WHERE l.course_id = $1
      )`, [course_id]
    )
    await client.query(
      `DELETE FROM assignment_submissions WHERE assignment_id IN (
        SELECT a.id FROM assignments a
        JOIN sub_lessons sl ON a.sub_lesson_id = sl.id
        JOIN lessons l ON sl.lesson_id = l.id
        WHERE l.course_id = $1
      )`, [course_id]
    )
    await client.query(
      `DELETE FROM question_options WHERE question_id IN (
        SELECT aq.id FROM assignment_questions aq
        JOIN assignments a ON aq.assignment_id = a.id
        JOIN sub_lessons sl ON a.sub_lesson_id = sl.id
        JOIN lessons l ON sl.lesson_id = l.id
        WHERE l.course_id = $1
      )`, [course_id]
    )
    await client.query(
      `DELETE FROM assignment_questions WHERE assignment_id IN (
        SELECT a.id FROM assignments a
        JOIN sub_lessons sl ON a.sub_lesson_id = sl.id
        JOIN lessons l ON sl.lesson_id = l.id
        WHERE l.course_id = $1
      )`, [course_id]
    )
    await client.query(
      `DELETE FROM assignments WHERE sub_lesson_id IN (
        SELECT sl.id FROM sub_lessons sl
        JOIN lessons l ON sl.lesson_id = l.id
        WHERE l.course_id = $1
      )`, [course_id]
    )

    /*
    2️⃣ ลบ sub_lesson_progress
    */

    await client.query(
      `DELETE FROM sub_lesson_progress WHERE sub_lesson_id IN (
        SELECT sl.id FROM sub_lessons sl
        JOIN lessons l ON sl.lesson_id = l.id
        WHERE l.course_id = $1
      )`, [course_id]
    )

    /*
    3️⃣ ลบ sub_lessons
    */

    await client.query(
      `DELETE FROM sub_lessons WHERE lesson_id IN (
        SELECT id FROM lessons WHERE course_id = $1
      )`, [course_id]
    )

    /*
    4️⃣ ลบ lesson_materials
    */

    await client.query(
      `DELETE FROM lesson_materials WHERE lesson_id IN (
        SELECT id FROM lessons WHERE course_id = $1
      )`, [course_id]
    )

    /*
    5️⃣ ลบ lessons
    */

    await client.query(`DELETE FROM lessons WHERE course_id = $1`, [course_id])

    /*
    6️⃣ ลบ course_materials, promo_code_courses, payments, promo_code_usages, enrollments
    */

    await client.query(`DELETE FROM course_materials WHERE course_id = $1`, [course_id])
    await client.query(`DELETE FROM promo_code_courses WHERE course_id = $1`, [course_id])
    await client.query(`DELETE FROM payments WHERE course_id = $1`, [course_id])
    await client.query(
      `DELETE FROM promo_code_usages WHERE enrollment_id IN (
        SELECT id FROM enrollments WHERE course_id = $1
      )`, [course_id]
    )
    await client.query(`DELETE FROM enrollments WHERE course_id = $1`, [course_id])

    /*
    7️⃣ ลบ course
    */

    await client.query(`DELETE FROM courses WHERE id = $1`, [course_id])

    await client.query("COMMIT")

    /*
    8️⃣ ลบไฟล์จาก Cloudinary (after DB commit)
    */
    if (cloudinaryUrls.length > 0) {
      deleteMultipleByUrl(cloudinaryUrls).catch(err =>
        console.error("Cloudinary cleanup error:", err)
      )
    }

    /*
    9️⃣ ลบไฟล์จาก Supabase Storage (after DB commit)
    */
    if (supabaseStoragePaths.length > 0) {
      supabase.storage
        .from("course-materials")
        .remove(supabaseStoragePaths)
        .then(({ error }) => {
          if (error) console.error("Supabase storage cleanup error:", error)
          else console.log(`Supabase storage: ${supabaseStoragePaths.length} files deleted`)
        })
        .catch(err => console.error("Supabase storage cleanup error:", err))
    }

    return res.status(200).json({
      message: "Course deleted",
      files_cleaned: {
        cloudinary: cloudinaryUrls.length,
        supabase_storage: supabaseStoragePaths.length,
      }
    })

  } catch(err){

    await client.query("ROLLBACK")

    console.error("Delete course error:",err)

    return res.status(500).json({
      message:"Internal server error"
    })

  } finally {

    client.release()

  }

}