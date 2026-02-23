import omise from "../../../libs/omise";
import pool from "../../../utils/db";

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
      if (charge.status === "successful") {
        // อัพเดต payment เป็น paid
        await pool.query(
          `UPDATE payments 
           SET status = 'paid', 
               paid_at = NOW(),
               provider_transaction_id = $1,
               updated_at = NOW()
           WHERE id = $2`,
          [charge.transaction || null, payment.id]
        );

        // สร้าง enrollment
        await pool.query(
          `INSERT INTO enrollments (user_id, course_id, status, enrolled_at, updated_at)
           VALUES ($1, $2, 'active', NOW(), NOW())
           ON CONFLICT (user_id, course_id) DO NOTHING`,
          [payment.user_id, payment.course_id]
        );

        console.log(`[Status Sync] Payment ${payment.id} updated to paid`);
      } else if (charge.status === "failed" || charge.status === "expired") {
        // อัพเดต payment เป็น failed
        await pool.query(
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

        console.log(`[Status Sync] Payment ${payment.id} updated to failed`);
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
