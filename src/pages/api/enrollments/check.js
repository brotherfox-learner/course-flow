import pool from "../../../utils/db";
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

  const { courseId } = req.query;
  if (!courseId) {
    return res.status(400).json({ error: "courseId is required" });
  }

  try {
    const result = await pool.query(
      `SELECT status FROM enrollments 
       WHERE user_id = $1 AND course_id = $2 
       AND status IN ('active', 'completed')`,
      [authUser.id, courseId]
    );

    const enrolled = result.rows.length > 0;
    const status = enrolled ? result.rows[0].status : null;

    return res.status(200).json({ enrolled, status });
  } catch (err) {
    console.error("Enrollment check error:", err);
    return res.status(500).json({ error: "Failed to check enrollment" });
  }
}
