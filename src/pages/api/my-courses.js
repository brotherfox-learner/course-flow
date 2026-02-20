import pool from "../../utils/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    // ดึงข้อมูล user (users table อาจมี column ต่างจาก name, avatar_url)
    let user = {
      id: userId,
      name: "User",
      avatar_url: null,
    };

    try {
      const userResult = await pool.query(
        "SELECT id FROM users WHERE id = $1",
        [userId]
      );
      if (userResult.rows.length > 0) {
        const row = userResult.rows[0];
        user.id = row.id;
        // ใช้ name ถ้ามี (บาง DB ใช้ full_name, username)
        user.name = row.full_name ?? row.username ?? row.name ?? "User";
        user.avatar_url = row.avatar_url ?? null;
      }
    } catch (userErr) {
      console.warn("User query fallback:", userErr.message);
      // ใช้ placeholder user
    }

    // ดึง enrolled courses พร้อม course info (ใช้ query แบบง่าย ไม่พึ่ง lessons/sub_lessons)
    let enrollmentsResult;
    try {
      enrollmentsResult = await pool.query(
        `SELECT 
          e.id as enrollment_id,
          e.status as enrollment_status,
          e.enrolled_at,
          c.id as course_id,
          c.course_name,
          c.course_summary,
          c.slug,
          c.cover_img_url,
          COALESCE(c.total_learning_time, 0) as total_learning_time,
          (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as lesson_count
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE e.user_id = $1
         ORDER BY e.status ASC`,
        [userId]
      );
    } catch (queryErr) {
      // ถ้า lessons ไม่มี หรือ total_learning_time ไม่มี - ใช้ query แบบง่าย
      console.warn("Fallback query for my-courses:", queryErr.message);
      enrollmentsResult = await pool.query(
        `SELECT 
          e.id as enrollment_id,
          e.status as enrollment_status,
          e.enrolled_at,
          c.id as course_id,
          c.course_name,
          c.course_summary,
          c.slug,
          c.cover_img_url
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE e.user_id = $1
         ORDER BY e.status ASC`,
        [userId]
      );
    }

    const courses = enrollmentsResult.rows;

    // นับ inprogress / completed
    const inprogressCount = courses.filter(
      (c) => c.enrollment_status === "active"
    ).length;
    const completedCount = courses.filter(
      (c) => c.enrollment_status === "completed"
    ).length;

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatar_url,
      },
      courses: courses.map((c) => ({
        enrollmentId: c.enrollment_id,
        enrollmentStatus: c.enrollment_status,
        enrolledAt: c.enrolled_at instanceof Date ? c.enrolled_at.toISOString() : c.enrolled_at,
        courseId: c.course_id,
        courseName: c.course_name,
        courseSummary: c.course_summary,
        slug: c.slug,
        coverImgUrl: c.cover_img_url,
        totalLearningTime: c.total_learning_time ?? 0,
        lessonCount: parseInt(c.lesson_count) || 0,
      })),
      stats: {
        inprogress: inprogressCount,
        completed: completedCount,
        total: courses.length,
      },
    });
  } catch (error) {
    console.error("My courses error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
