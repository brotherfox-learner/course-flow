import pool from "../../utils/db";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authUser) {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    let user = {
      id: authUser.id,
      name: "User",
      avatar_url: null,
    };

    try {
      const userResult = await pool.query(
        "SELECT id, profile_name, first_name, last_name, avatar_url FROM users WHERE id = $1",
        [authUser.id]
      );
      if (userResult.rows.length > 0) {
        const row = userResult.rows[0];
        user.id = row.id;
        user.name = row.profile_name ?? ([row.first_name, row.last_name].filter(Boolean).join(" ") || "User");
        user.avatar_url = row.avatar_url ?? null;
      }
    } catch (userErr) {
      console.warn("User query fallback:", userErr.message);
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
         AND (e.status = 'active' OR e.status = 'completed')
         ORDER BY e.status ASC`,
        [user.id]
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
         AND (e.status = 'active' OR e.status = 'completed')
         ORDER BY e.status ASC`,
        [user.id]
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
