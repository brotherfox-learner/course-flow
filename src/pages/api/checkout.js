import omise from "../../libs/omise";
import pool from "../../utils/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    token, // Card token from Omise.js (tokn_xxx)
    sourceId, // Source ID from Omise.js for PromptPay (src_xxx)
    courseId,
    userId, // Will be from auth later, hardcoded for now
    promoCode,
    paymentMethod, // "card" or "promptpay"
  } = req.body;

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
    let finalAmount = parseFloat(course.price);
    let promoCodeId = null;

    // 2. Apply promo code if provided
    if (promoCode) {
      const promoResult = await client.query(
        `SELECT * FROM promo_codes 
         WHERE code = $1 
         AND (valid_from IS NULL OR valid_from <= NOW()) 
         AND (valid_until IS NULL OR valid_until >= NOW())`,
        [promoCode]
      );

      if (promoResult.rows.length > 0) {
        const promo = promoResult.rows[0];

        // Check max_uses
        if (promo.max_uses) {
          const usageResult = await client.query(
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
        if (promo.min_price && finalAmount < parseFloat(promo.min_price)) {
          return res
            .status(400)
            .json({ error: "Order does not meet minimum price for this promo code" });
        }

        // Calculate discount
        if (promo.discount_type === "fixed") {
          finalAmount = Math.max(0, finalAmount - parseFloat(promo.discount_value));
        } else if (promo.discount_type === "percent") {
          finalAmount = finalAmount * (1 - parseFloat(promo.discount_value) / 100);
        }

        promoCodeId = promo.id;
      }
    }

    // 3. Convert to smallest currency unit (satang) for Omise
    const amountInSatang = Math.round(finalAmount * 100);

    if (amountInSatang < 2000) {
      // Omise minimum is 20 THB
      return res
        .status(400)
        .json({ error: "Amount must be at least 20 THB" });
    }

    // 4. Create charge via Omise
    let charge;
    const chargeParams = {
      amount: amountInSatang,
      currency: "THB",
    };

    if (paymentMethod === "card" && token) {
      // Card payment — instant capture
      chargeParams.card = token;
      charge = await omise.charges.create(chargeParams);
    } else if (paymentMethod === "promptpay" && sourceId) {
      // PromptPay — async (pending until customer scans QR)
      chargeParams.source = sourceId;
      charge = await omise.charges.create(chargeParams);
    } else {
      return res.status(400).json({ error: "Invalid payment method or missing token/source" });
    }

    // 5. Begin transaction to save payment + enrollment
    await client.query("BEGIN");

    // Insert payment record
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

    // 6. If card payment is successful, create enrollment immediately
    if (charge.status === "successful") {
      await client.query(
        `INSERT INTO enrollments (user_id, course_id, promo_code_id, status, enrolled_at, updated_at)
         VALUES ($1, $2, $3, 'active', NOW(), NOW())
         ON CONFLICT (user_id, course_id) DO NOTHING`,
        [userId, courseId, promoCodeId]
      );

      // Update payment with paid_at
      await client.query(
        `UPDATE payments SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [paymentId]
      );
    }

    await client.query("COMMIT");

    // 7. Build response
    const response = {
      success: true,
      chargeId: charge.id,
      status: charge.status,
      paymentId,
      amount: finalAmount,
      courseSlug: course.slug,
    };

    // For PromptPay, include QR code data
    if (paymentMethod === "promptpay" && charge.source?.scannable_code) {
      response.qrCodeUri =
        charge.source.scannable_code.image?.download_uri || null;
      response.authorizeUri = charge.authorize_uri || null;
    }

    return res.status(200).json(response);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Checkout error:", error);

    // Handle Omise-specific errors
    if (error.code) {
      return res.status(400).json({
        error: "Payment failed",
        failureCode: error.code,
        failureMessage: error.message,
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}
