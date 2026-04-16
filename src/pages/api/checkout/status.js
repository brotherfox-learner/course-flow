import omise from "@/infrastructure/omise";
import pool from "@/infrastructure/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { chargeId } = req.query;

  if (!chargeId) {
    return res.status(400).json({ error: "chargeId is required" });
  }

  try {
    // Check charge status from Omise
    const charge = await omise.charges.retrieve(chargeId);

    // Also get the payment from our DB
    const paymentResult = await pool.query(
      `SELECT p.id, p.status, p.user_id, p.course_id, c.slug as course_slug, c.course_name
       FROM payments p
       JOIN courses c ON c.id = p.course_id
       WHERE p.provider_charge_id = $1`,
      [chargeId]
    );

    const payment = paymentResult.rows[0] || null;

    // ── Sync DB กับ Omise status (ทดแทน webhook สำหรับ localhost) ──
    // ถ้า Omise บอกว่า successful แต่ DB ยังเป็น pending → อัพเดตให้ตรง
    if (payment && payment.status === "pending") {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        if (charge.status === "successful") {
          // อัพเดต payment เป็น paid
          await client.query(
            `UPDATE payments 
             SET status = 'paid', 
                 paid_at = NOW(),
                 provider_transaction_id = $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [charge.transaction || null, payment.id]
          );

          // สร้างหรืออัปเดต enrollment (pending_payment/wishlist → active)
          const enrollResult = await client.query(
            `INSERT INTO enrollments (user_id, course_id, status, enrolled_at, updated_at)
             VALUES ($1, $2, 'active', NOW(), NOW())
             ON CONFLICT (user_id, course_id) DO UPDATE SET
               status = 'active',
               enrolled_at = NOW(),
               updated_at = NOW()
             RETURNING id, promo_code_id`,
            [payment.user_id, payment.course_id]
          );

          // อัปเดต promo usage ที่จองไว้ (enrollment_id = NULL) ให้ชี้ไปที่ enrollment
          const enrollment = enrollResult.rows[0];
          if (enrollment?.promo_code_id) {
            await client.query(
              `UPDATE promo_code_usages
               SET enrollment_id = $1
               WHERE promo_code_id = $2 AND user_id = $3 AND enrollment_id IS NULL`,
              [enrollment.id, enrollment.promo_code_id, payment.user_id]
            );
          }

          console.log(`[Status Sync] Payment ${payment.id} updated to paid`);
        } else if (charge.status === "failed" || charge.status === "expired") {
          // อัพเดต payment เป็น failed
          await client.query(
            `UPDATE payments 
             SET status = 'failed',
                 failure_code = $1,
                 failure_message = $2,
                 updated_at = NOW()
             WHERE id = $3`,
            [
              charge.failure_code || null,
              charge.failure_message || null,
              payment.id,
            ]
          );

          // ลบ reserved promo usage (enrollment_id IS NULL) เพื่อปล่อย slot กลับ
          const enrollRow = await client.query(
            `SELECT promo_code_id FROM enrollments
             WHERE user_id = $1 AND course_id = $2 AND status = 'pending_payment'`,
            [payment.user_id, payment.course_id]
          );
          if (enrollRow.rows[0]?.promo_code_id) {
            await client.query(
              `DELETE FROM promo_code_usages
               WHERE promo_code_id = $1 AND user_id = $2 AND enrollment_id IS NULL`,
              [enrollRow.rows[0].promo_code_id, payment.user_id]
            );
          }

          console.log(`[Status Sync] Payment ${payment.id} updated to failed`);
        }

        await client.query("COMMIT");
      } catch (txError) {
        await client.query("ROLLBACK");
        throw txError;
      } finally {
        client.release();
      }
    }

    return res.status(200).json({
      chargeId: charge.id,
      status: charge.status,
      paid: charge.paid,
      amount: charge.amount / 100, // Convert from satang to THB
      courseSlug: payment?.course_slug || null,
      courseName: payment?.course_name || null,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return res.status(500).json({ error: "Failed to check payment status" });
  }
}
