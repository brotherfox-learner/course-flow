import omise from "../../libs/omise";
import pool from "../../utils/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    token,
    sourceId,
    courseId,
    userId,
    promoCode,
    paymentMethod,
  } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "User must be logged in to complete payment" });
  }

  const client = await pool.connect();

  try {
    // 1. Get course info
    const courseResult = await client.query(
      "SELECT id, course_name, slug, price FROM courses WHERE id = $1",
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    const course = courseResult.rows[0];

    // 2. Check already enrolled (active/completed)
    const existingEnrollment = await client.query(
      `SELECT id FROM enrollments
       WHERE user_id = $1 AND course_id = $2 AND status IN ('active', 'completed')`,
      [userId, courseId]
    );
    if (existingEnrollment.rows.length > 0) {
      return res.status(400).json({
        error: "Already enrolled in this course",
        alreadyEnrolled: true,
        courseSlug: course.slug,
      });
    }

    let finalAmount = parseFloat(course.price);
    let promoCodeId = null;
    let promo = null;

    // 3. Basic promo lookup (no lock yet — for early validation)
    if (promoCode) {
      const normalizedCode = promoCode.trim().toUpperCase();

      const promoResult = await client.query(
        `SELECT * FROM promo_codes
         WHERE code = $1
           AND (valid_from IS NULL OR valid_from <= NOW())
           AND (valid_until IS NULL OR valid_until >= NOW())`,
        [normalizedCode]
      );

      if (promoResult.rows.length === 0) {
        return res.status(400).json({ error: "Invalid or expired promo code" });
      }

      promo = promoResult.rows[0];

      // Course restriction check
      const courseRestriction = await client.query(
        `SELECT course_id FROM promo_code_courses WHERE promo_code_id = $1`,
        [promo.id]
      );
      if (courseRestriction.rows.length > 0) {
        const allowed = courseRestriction.rows.some(
          (r) => String(r.course_id) === String(courseId)
        );
        if (!allowed) {
          return res.status(400).json({
            error: "This promo code is not valid for this course",
          });
        }
      }

      // Min price check
      if (promo.min_price && finalAmount < parseFloat(promo.min_price)) {
        return res.status(400).json({
          error: "Order does not meet minimum price for this promo code",
        });
      }

      // Calculate discount (for amount; validation under lock comes later)
      if (promo.discount_type === "fixed") {
        finalAmount = Math.max(0, finalAmount - parseFloat(promo.discount_value));
      } else if (promo.discount_type === "percent") {
        finalAmount = finalAmount * (1 - parseFloat(promo.discount_value) / 100);
      }

      promoCodeId = promo.id;
    }

    // 4. Amount check
    const amountInSatang = Math.round(finalAmount * 100);
    if (amountInSatang < 2000) {
      return res.status(400).json({ error: "Amount must be at least 20 THB" });
    }

    if (paymentMethod !== "card" && paymentMethod !== "promptpay") {
      return res.status(400).json({ error: "Invalid payment method" });
    }
    if ((paymentMethod === "card" && !token) || (paymentMethod === "promptpay" && !sourceId)) {
      return res.status(400).json({ error: "Invalid payment method or missing token/source" });
    }

    // ── BEGIN: Lock promo BEFORE charge to prevent race condition ──
    await client.query("BEGIN");

    if (promoCodeId) {
      // Lock promo row so only one request can "reserve" it at a time
      const lockResult = await client.query(
        `SELECT id, max_uses FROM promo_codes WHERE id = $1 FOR UPDATE`,
        [promoCodeId]
      );

      if (lockResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Invalid or expired promo code" });
      }

      // Re-check max_uses under lock
      const usageCount = await client.query(
        `SELECT COUNT(*)::int AS count FROM promo_code_usages WHERE promo_code_id = $1`,
        [promoCodeId]
      );
      const maxUses = lockResult.rows[0].max_uses;
      if (maxUses && usageCount.rows[0].count >= maxUses) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Promo code has reached maximum uses" });
      }

      // Re-check per-user under lock
      const userUsage = await client.query(
        `SELECT id FROM promo_code_usages WHERE promo_code_id = $1 AND user_id = $2`,
        [promoCodeId, userId]
      );
      if (userUsage.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "You have already used this promo code" });
      }
    }

    // 5. Create charge via Omise (while holding lock)
    let charge;
    const chargeParams = { amount: amountInSatang, currency: "THB" };

    if (paymentMethod === "card") {
      chargeParams.card = token;
      charge = await omise.charges.create(chargeParams);
    } else {
      chargeParams.source = sourceId;
      charge = await omise.charges.create(chargeParams);
    }

    // If charge creation fails, rollback (no charge was made)
    if (!charge) {
      await client.query("ROLLBACK");
      return res.status(500).json({ error: "Failed to create charge" });
    }

    // 6. Insert payment record
    const paymentResult = await client.query(
      `INSERT INTO payments (
        user_id, course_id, provider, provider_charge_id, provider_source_id,
        amount, currency, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id`,
      [
        userId,
        courseId,
        "omise",
        charge.id,
        charge.source ? charge.source.id : null,
        finalAmount,
        "THB",
        charge.status === "successful" ? "paid" : "pending",
      ]
    );

    const paymentId = paymentResult.rows[0].id;

    if (charge.status === "successful") {
      // Card: create enrollment + record usage
      const enrollResult = await client.query(
        `INSERT INTO enrollments (user_id, course_id, promo_code_id, status, enrolled_at, updated_at)
         VALUES ($1, $2, $3, 'active', NOW(), NOW())
         ON CONFLICT (user_id, course_id) DO UPDATE SET
           status = 'active',
           enrolled_at = NOW(),
           updated_at = NOW(),
           promo_code_id = COALESCE(EXCLUDED.promo_code_id, enrollments.promo_code_id)
         RETURNING id`,
        [userId, courseId, promoCodeId]
      );

      const enrollmentId = enrollResult.rows[0].id;

      if (promoCodeId) {
        await client.query(
          `INSERT INTO promo_code_usages (promo_code_id, user_id, enrollment_id)
           VALUES ($1, $2, $3)`,
          [promoCodeId, userId, enrollmentId]
        );
      }

      await client.query(
        `UPDATE payments SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [paymentId]
      );
    } else {
      // PromptPay (pending): reserve usage slot so second request fails
      const enrollResult = await client.query(
        `INSERT INTO enrollments (user_id, course_id, promo_code_id, status, enrolled_at, updated_at)
         VALUES ($1, $2, $3, 'pending_payment', NOW(), NOW())
         ON CONFLICT (user_id, course_id) DO UPDATE SET
           promo_code_id = EXCLUDED.promo_code_id,
           updated_at = NOW()
         RETURNING id`,
        [userId, courseId, promoCodeId]
      );

      if (promoCodeId) {
        // Reserve slot with enrollment_id = NULL; update when payment completes
        await client.query(
          `INSERT INTO promo_code_usages (promo_code_id, user_id, enrollment_id)
           VALUES ($1, $2, NULL)`,
          [promoCodeId, userId]
        );
      }
    }

    await client.query("COMMIT");

    const response = {
      success: true,
      chargeId: charge.id,
      status: charge.status,
      paymentId,
      amount: finalAmount,
      courseSlug: course.slug,
    };

    if (paymentMethod === "promptpay" && charge.source?.scannable_code) {
      response.qrCodeUri =
        charge.source.scannable_code.image?.download_uri || null;
      response.authorizeUri = charge.authorize_uri || null;
    }

    return res.status(200).json(response);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Checkout error:", error);

    const isOmiseError =
      error.code && typeof error.code === "string" && !/^\d/.test(error.code);

    if (isOmiseError) {
      return res.status(400).json({
        error: `Payment failed: ${error.message}`,
        failureCode: error.code,
        failureMessage: error.message,
      });
    }

    const dbMessage =
      error.code === "23503"
        ? "Database reference error — user or course may not exist"
        : error.code === "42P01"
          ? "Database table does not exist"
          : error.message;

    return res.status(500).json({
      error: `Server error: ${dbMessage}`,
      code: error.code || null,
    });
  } finally {
    client.release();
  }
}
