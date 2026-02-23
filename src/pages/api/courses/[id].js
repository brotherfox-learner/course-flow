import pool from "../../../utils/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  try {
    const result = await pool.query(
      "SELECT * FROM courses WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Failed to fetch course",
      details: error.message,
    });
  }
}
