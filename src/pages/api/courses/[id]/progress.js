/**
 * Course progress API: GET returns completed + in_progress sub-lesson IDs;
 * POST accepts { sub_lesson_id, status?: 'in_progress' | 'completed' }.
 *
 * DB: table sub_lesson_progress must allow status = 'in_progress'.
 * If you see constraint errors, run in Supabase SQL Editor:
 *   ALTER TABLE sub_lesson_progress DROP CONSTRAINT IF EXISTS sub_lesson_progress_status_check;
 *   ALTER TABLE sub_lesson_progress ADD CONSTRAINT sub_lesson_progress_status_check CHECK (status IN ('completed', 'in_progress'));
 */
import pool from "../../../../utils/db";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }
  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { ok: false, status: 401, message: "Invalid token" };
  }
  return { ok: true, user };
}

export default async function handler(req, res) {
  const { id: courseId } = req.query;
  if (!courseId) {
    return res.status(400).json({ error: "Course ID required" });
  }

  const auth = await getAuthUser(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.message });
  }
  const userId = auth.user.id;

  if (req.method === "GET") {
    try {
      const totalResult = await pool.query(
        `SELECT COUNT(sl.id)::int AS total
         FROM lessons l
         JOIN sub_lessons sl ON sl.lesson_id = l.id
         WHERE l.course_id = $1`,
        [courseId]
      );
      const totalSubLessons = totalResult.rows[0]?.total ?? 0;

      const completedResult = await pool.query(
        `SELECT slp.sub_lesson_id
         FROM sub_lesson_progress slp
         JOIN sub_lessons sl ON sl.id = slp.sub_lesson_id
         JOIN lessons l ON l.id = sl.lesson_id
         WHERE slp.user_id = $1 AND slp.status = 'completed' AND l.course_id = $2`,
        [userId, courseId]
      );
      const completedSubLessonIds = (completedResult.rows || []).map(
        (r) => r.sub_lesson_id
      );

      const inProgressResult = await pool.query(
        `SELECT slp.sub_lesson_id
         FROM sub_lesson_progress slp
         JOIN sub_lessons sl ON sl.id = slp.sub_lesson_id
         JOIN lessons l ON l.id = sl.lesson_id
         WHERE slp.user_id = $1 AND slp.status = 'in_progress' AND l.course_id = $2`,
        [userId, courseId]
      );
      const inProgressSubLessonIds = (inProgressResult.rows || []).map(
        (r) => r.sub_lesson_id
      );

      const progressPercent =
        totalSubLessons > 0
          ? Math.round((completedSubLessonIds.length / totalSubLessons) * 100)
          : 0;

      return res.status(200).json({
        completedSubLessonIds,
        inProgressSubLessonIds,
        totalSubLessons,
        progressPercent,
      });
    } catch (err) {
      console.error("GET progress error:", err);
      return res.status(500).json({ error: "Failed to fetch progress" });
    }
  }

  if (req.method === "POST") {
    const { sub_lesson_id, status: bodyStatus } = req.body ?? {};
    if (!sub_lesson_id) {
      return res.status(400).json({ error: "sub_lesson_id required" });
    }
    const status = bodyStatus === "in_progress" ? "in_progress" : "completed";

    try {
      const courseCheck = await pool.query(
        `SELECT 1 FROM sub_lessons sl
         JOIN lessons l ON l.id = sl.lesson_id
         WHERE sl.id = $1 AND l.course_id = $2`,
        [sub_lesson_id, courseId]
      );
      if (courseCheck.rows.length === 0) {
        return res.status(400).json({ error: "Sub-lesson not in this course" });
      }

      if (status === "completed") {
        await pool.query(
          `INSERT INTO sub_lesson_progress (user_id, sub_lesson_id, status)
           VALUES ($1, $2, 'completed')
           ON CONFLICT (user_id, sub_lesson_id)
           DO UPDATE SET status = 'completed', updated_at = NOW()`,
          [userId, sub_lesson_id]
        );
      } else {
        await pool.query(
          `INSERT INTO sub_lesson_progress (user_id, sub_lesson_id, status)
           VALUES ($1, $2, 'in_progress')
           ON CONFLICT (user_id, sub_lesson_id)
           DO UPDATE SET
             status = CASE WHEN sub_lesson_progress.status = 'completed' THEN 'completed' ELSE 'in_progress' END,
             updated_at = NOW()`,
          [userId, sub_lesson_id]
        );
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("POST progress error:", err);
      return res.status(500).json({ error: "Failed to save progress" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
