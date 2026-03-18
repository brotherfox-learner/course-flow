import pool from "@/infrastructure/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const isNumeric = /^\d+$/.test(id);

  try {
    // Resolve slug to numeric course ID if needed
    let courseId = id;
    if (!isNumeric) {
      const courseRes = await pool.query(
        "SELECT id FROM courses WHERE slug = $1",
        [id]
      );
      if (courseRes.rows.length === 0) {
        return res.status(404).json({ error: "Course not found" });
      }
      courseId = courseRes.rows[0].id;
    }

    // Query lessons with their sub_lessons
    const result = await pool.query(
      `
      SELECT 
        l.id,
        l.name,
        l.order_index,
        json_agg(
          json_build_object(
            'id', sl.id::text,
            'name', sl.name,
            'vdo_url', sl.vdo_url,
            'vdo_time', sl.vdo_time,
            'content_type', sl.content_type,
            'content', sl.content,
            'order_index', sl.order_index
          )
          ORDER BY sl.order_index ASC NULLS LAST
        ) FILTER (WHERE sl.id IS NOT NULL) as sub_lessons
      FROM lessons l
      LEFT JOIN sub_lessons sl ON l.id = sl.lesson_id
      WHERE l.course_id = $1
      GROUP BY l.id, l.name
      ORDER BY l.id ASC
    `,
      [courseId]
    );

    // Transform the result to match the expected format
    const lessons = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      order_index:row.order_index,
      sub_lessons: row.sub_lessons || [],
    }));

    res.status(200).json(lessons);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Failed to fetch lessons",
      details: error.message,
    });
  }
}
