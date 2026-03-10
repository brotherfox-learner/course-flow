// src/pages/api/sub-lessons/[subLessonId]/time.js
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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { ok: false, status: 401, message: "Invalid token" };
  }

  return { ok: true, user };
}

export default async function handler(req, res) {
  const { subLessonId } = req.query;

  if (!subLessonId) {
    return res.status(400).json({ error: "subLessonId required" });
  }

  const auth = await getAuthUser(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.message });
  }
  const userId = auth.user.id;

  if (req.method === "GET") {
    try {
      const result = await pool.query(
        `SELECT last_position_seconds, video_duration_seconds
         FROM sub_lesson_progress
         WHERE user_id = $1 AND sub_lesson_id = $2
         LIMIT 1`,
        [userId, subLessonId]
      );

      if (result.rows.length === 0) {
        return res.status(200).json({
          lastPositionSeconds: null,
          videoDurationSeconds: null,
        });
      }

      const row = result.rows[0];
      return res.status(200).json({
        lastPositionSeconds: row.last_position_seconds,
        videoDurationSeconds: row.video_duration_seconds,
      });
    } catch (error) {
      console.error("GET sub-lesson time error:", error);
      return res.status(500).json({ error: "Failed to fetch time" });
    }
  }

  if (req.method === "PATCH") {
    const { positionSeconds, durationSeconds } = req.body ?? {};

    if (
      typeof positionSeconds !== "number" ||
      !Number.isFinite(positionSeconds) ||
      positionSeconds < 0
    ) {
      return res
        .status(400)
        .json({ error: "positionSeconds must be a non-negative number" });
    }

    const safeDuration =
      typeof durationSeconds === "number" &&
      Number.isFinite(durationSeconds) &&
      durationSeconds > 0
        ? durationSeconds
        : null;

    try {
      await pool.query(
        `INSERT INTO sub_lesson_progress (
           user_id,
           sub_lesson_id,
           status,
           last_position_seconds,
           video_duration_seconds,
           last_position_updated_at,
           updated_at
         )
         VALUES ($1, $2, 'in_progress', $3, $4, NOW(), NOW())
         ON CONFLICT (user_id, sub_lesson_id)
         DO UPDATE SET
           last_position_seconds  = EXCLUDED.last_position_seconds,
           video_duration_seconds = EXCLUDED.video_duration_seconds,
           last_position_updated_at = NOW(),
           updated_at = NOW(),
           status = CASE
             WHEN sub_lesson_progress.status = 'completed'
               THEN 'completed'
             ELSE 'in_progress'
           END`,
        [userId, subLessonId, positionSeconds, safeDuration]
      );

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("PATCH sub-lesson time error:", error);
      return res.status(500).json({ error: "Failed to save time" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

