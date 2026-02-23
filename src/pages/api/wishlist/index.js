import pool from "@/utils/db";

/**
 * GET /api/wishlist?userId=uuid
 * Returns list of courses where enrollment status = 'wishlist'
 */
export default async function handler(req, res) {
  if (req.method === "GET") {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    try {
      const result = await pool.query(
        `SELECT
          e.id AS enrollment_id,
          e.status AS enrollment_status,
          e.enrolled_at,
          c.id AS course_id,
          c.course_name,
          c.course_summary,
          c.cover_img_url,
          COALESCE(c.total_learning_time, 0) AS total_learning_time,
          (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS lesson_count
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE e.user_id = $1 AND e.status = 'wishlist'
         ORDER BY e.enrolled_at DESC`,
        [userId]
      );
      const courses = result.rows.map((c) => ({
        enrollmentId: c.enrollment_id,
        enrollmentStatus: c.enrollment_status,
        enrolledAt:
          c.enrolled_at instanceof Date
            ? c.enrolled_at.toISOString()
            : c.enrolled_at,
        courseId: c.course_id,
        courseName: c.course_name,
        courseSummary: c.course_summary,
        coverImgUrl: c.cover_img_url,
        totalLearningTime: c.total_learning_time ?? 0,
        lessonCount: parseInt(c.lesson_count, 10) || 0,
      }));
      return res.status(200).json({ courses });
    } catch (err) {
      console.error("Wishlist GET error:", err);
      return res.status(500).json({ error: "Failed to load wishlist" });
    }
  }

  if (req.method === "POST") {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const userId = user.id;

    let body;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
    const { courseId } = body;
    if (courseId == null || Number.isNaN(Number(courseId))) {
      return res.status(400).json({ error: "courseId is required" });
    }
    const courseIdInt = Number(courseId);

    try {
      await pool.query(
        `INSERT INTO enrollments (user_id, course_id, status, enrolled_at)
         VALUES ($1, $2, 'wishlist', NOW())
         ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'wishlist', enrolled_at = NOW()`,
        [userId, courseIdInt]
      );
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Wishlist POST error:", err);
      return res.status(500).json({ error: "Failed to add to wishlist" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
