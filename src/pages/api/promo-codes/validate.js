import pool from "@/infrastructure/db";
import { createClient } from "@supabase/supabase-js";
import { resolveChargeAfterPromo } from "@/shared/utils/omiseChargeAmount";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, courseId, coursePrice } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Promo code is required" });
  }

  /* ---------------- Optional auth — needed for per-user check ---------------- */

  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (!authError && user) {
      userId = user.id;
    }
  }

  /* Use a transaction with a row-level lock on promo_codes to prevent race
     conditions when two requests simultaneously check max_uses. */
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    /* 1. Fetch and lock the promo code row */
    const promoResult = await client.query(
      `SELECT * FROM promo_codes
       WHERE code = $1
         AND (valid_from IS NULL OR valid_from <= NOW())
         AND (valid_until IS NULL OR valid_until >= NOW())
       FOR UPDATE`,
      [code.trim().toUpperCase()]
    );

    if (promoResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Invalid or expired promo code" });
    }

    const promo = promoResult.rows[0];

    /* 2. Course restriction check (promo_code_courses)
          If no rows exist for this promo → applicable to all courses.
          If rows exist → courseId must be among them. */
    if (courseId) {
      const courseRestrictionResult = await client.query(
        `SELECT id FROM promo_code_courses WHERE promo_code_id = $1`,
        [promo.id]
      );

      if (courseRestrictionResult.rows.length > 0) {
        const allowed = courseRestrictionResult.rows.some(
          (r) => String(r.course_id) === String(courseId)
        );
        if (!allowed) {
          await client.query("ROLLBACK");
          return res
            .status(400)
            .json({ error: "This promo code is not valid for this course" });
        }
      }
    }

    /* 3. max_uses check — count from promo_code_usages (not enrollments) */
    if (promo.max_uses) {
      const usageCountResult = await client.query(
        `SELECT COUNT(*)::int AS count FROM promo_code_usages WHERE promo_code_id = $1`,
        [promo.id]
      );
      if (usageCountResult.rows[0].count >= promo.max_uses) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Promo code has reached maximum uses" });
      }
    }

    /* 4. Per-user duplicate-use check */
    if (userId) {
      const alreadyUsedResult = await client.query(
        `SELECT id FROM promo_code_usages WHERE promo_code_id = $1 AND user_id = $2`,
        [promo.id, userId]
      );
      if (alreadyUsedResult.rows.length > 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "You have already used this promo code" });
      }
    }

    /* 5. min_price check */
    const price = parseFloat(coursePrice) || 0;
    if (promo.min_price && price < parseFloat(promo.min_price)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `Minimum order of ${promo.min_price} THB required for this promo code`,
      });
    }

    await client.query("COMMIT");

    /* 6. Nominal discount from promo config, then clamp to Omise minimum charge */
    let nominalDiscount = 0;
    if (promo.discount_type === "fixed") {
      nominalDiscount = parseFloat(promo.discount_value);
    } else if (promo.discount_type === "percent") {
      nominalDiscount = price * (parseFloat(promo.discount_value) / 100);
    }
    nominalDiscount = Math.round(nominalDiscount * 100) / 100;
    const naiveFinal = Math.round((price - nominalDiscount) * 100) / 100;
    const { finalAmountThb, effectiveDiscountThb, discountCappedToMinimum } =
      resolveChargeAfterPromo(price, naiveFinal);

    return res.status(200).json({
      valid: true,
      promoId: promo.id,
      code: promo.code,
      name: promo.name,
      discountType: promo.discount_type,
      discountValue: parseFloat(promo.discount_value),
      discountAmount: effectiveDiscountThb,
      finalPrice: finalAmountThb,
      discountCappedToMinimum,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Promo code validation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}
