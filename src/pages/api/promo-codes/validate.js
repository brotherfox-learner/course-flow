import pool from "../../../utils/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, coursePrice } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Promo code is required" });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM promo_codes 
       WHERE code = $1 
       AND (valid_from IS NULL OR valid_from <= NOW()) 
       AND (valid_until IS NULL OR valid_until >= NOW())`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invalid or expired promo code" });
    }

    const promo = result.rows[0];

    // Check max_uses
    if (promo.max_uses) {
      const usageResult = await pool.query(
        "SELECT COUNT(*) as count FROM enrollments WHERE promo_code_id = $1",
        [promo.id]
      );
      if (parseInt(usageResult.rows[0].count) >= promo.max_uses) {
        return res
          .status(400)
          .json({ error: "Promo code has reached maximum uses" });
      }
    }

    // Check min_price
    const price = parseFloat(coursePrice) || 0;
    if (promo.min_price && price < parseFloat(promo.min_price)) {
      return res.status(400).json({
        error: `Minimum order of ${promo.min_price} THB required for this promo code`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discount_type === "fixed") {
      discountAmount = parseFloat(promo.discount_value);
    } else if (promo.discount_type === "percent") {
      discountAmount = price * (parseFloat(promo.discount_value) / 100);
    }

    return res.status(200).json({
      valid: true,
      code: promo.code,
      name: promo.name,
      discountType: promo.discount_type,
      discountValue: parseFloat(promo.discount_value),
      discountAmount: Math.round(discountAmount * 100) / 100,
    });
  } catch (error) {
    console.error("Promo code validation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
