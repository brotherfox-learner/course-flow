import pool from "../../utils/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(l.id)::int AS lesson_count
       FROM courses c
       LEFT JOIN lessons l ON l.course_id = c.id
       GROUP BY c.id`
    );
    res.status(200).json({ courses: result.rows });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Failed to fetch courses",
      details: error.message,
      hint: error.code === "42P01" ? "Table 'public.courses' does not exist. Create it in Supabase first." : null,
    });
  }
}
