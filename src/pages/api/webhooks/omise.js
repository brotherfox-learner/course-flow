import pool from "@/infrastructure/db";

export const config = {
  api: {
    bodyParser: true,
  },
};

// Omise webhook endpoint
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // connect to the database
  const client = await pool.connect();

  try {
    console.log("Webhook called");
    console.log("Method:", req.method);
    console.log("Body:", req.body);

    // รับ event จาก Omise
    const event = req.body;
    // เก็บ key ของ event
    const eventKey = event.key; // e.g. "charge.complete"
    // เก็บ data ของ event
    const chargeData = event.data;

    // 1. Log the webhook
    await client.query(
      `INSERT INTO payment_webhooks (provider, event_type, payload, received_at)
       VALUES ($1, $2, $3, NOW())`,
      ["omise", eventKey, JSON.stringify(event)]
    );

    // 2. Handle charge.complete event
    if (eventKey === "charge.complete" && chargeData) {
      const chargeId = chargeData.id;
      const chargeStatus = chargeData.status;

      await client.query("BEGIN");

      // Update payment status
      if (chargeStatus === "successful") {
        await client.query(
          `UPDATE payments 
           SET status = 'paid', 
               paid_at = NOW(), 
               provider_transaction_id = $1,
               updated_at = NOW()
           WHERE provider = 'omise' AND provider_charge_id = $2`,
          [chargeData.transaction || null, chargeId]
        );

        // Get the payment to create enrollment
        const paymentResult = await client.query(
          `SELECT user_id, course_id FROM payments 
           WHERE provider = 'omise' AND provider_charge_id = $1`,
          [chargeId]
        );

        // ถ้ามี payment ที่สอดคล้องกับ chargeId สร้าง enrollment
        if (paymentResult.rows.length > 0) {
          const { user_id, course_id } = paymentResult.rows[0];

          // สร้างหรืออัปเดต enrollment (pending_payment/wishlist → active เมื่อชำระสำเร็จ)
          const enrollResult = await client.query(
            `INSERT INTO enrollments (user_id, course_id, status, enrolled_at, updated_at)
             VALUES ($1, $2, 'active', NOW(), NOW())
             ON CONFLICT (user_id, course_id) DO UPDATE SET
               status = 'active',
               enrolled_at = NOW(),
               updated_at = NOW()
             RETURNING id, promo_code_id`,
            [user_id, course_id]
          );

          // อัปเดต promo usage ที่จองไว้ (enrollment_id = NULL) ให้ชี้ไปที่ enrollment
          const enrollment = enrollResult.rows[0];
          if (enrollment?.promo_code_id) {
            await client.query(
              `UPDATE promo_code_usages
               SET enrollment_id = $1
               WHERE promo_code_id = $2 AND user_id = $3 AND enrollment_id IS NULL`,
              [enrollment.id, enrollment.promo_code_id, user_id]
            );
          }
        }
      }
      // ถ้าการชำระเงินล้มเหลว หรือหมดอายุ
      else if (chargeStatus === "failed" || chargeStatus === "expired") {
        // อัพเดต payment ด้วย failed หรือ expired
        await client.query(
          `UPDATE payments 
           SET status = 'failed', 
               failure_code = $1,
               failure_message = $2,
               updated_at = NOW()
           WHERE provider = 'omise' AND provider_charge_id = $3`,
          [
            chargeData.failure_code || null,
            chargeData.failure_message || null,
            chargeId,
          ]
        );

        // ลบ reserved promo usage เพื่อปล่อย slot กลับ
        const paymentRow = await client.query(
          `SELECT user_id, course_id FROM payments 
           WHERE provider = 'omise' AND provider_charge_id = $1`,
          [chargeId]
        );
        if (paymentRow.rows.length > 0) {
          const { user_id, course_id } = paymentRow.rows[0];
          const enrollRow = await client.query(
            `SELECT promo_code_id FROM enrollments
             WHERE user_id = $1 AND course_id = $2 AND status = 'pending_payment'`,
            [user_id, course_id]
          );
          if (enrollRow.rows[0]?.promo_code_id) {
            await client.query(
              `DELETE FROM promo_code_usages
               WHERE promo_code_id = $1 AND user_id = $2 AND enrollment_id IS NULL`,
              [enrollRow.rows[0].promo_code_id, user_id]
            );
          }
        }
      }

      await client.query("COMMIT");
    }

    // ส่งกลับข้อมูลว่าได้รับ event จาก Omise
    return res.status(200).json({ received: true });
  } catch (error) {
    // ถ้ามี error อัปเดต rollback
    await client.query("ROLLBACK").catch(() => { });
    console.error("Webhook error:", error);
    // ส่งกลับข้อมูลว่าไม่สามารถประมวลผล webhook ได้
    return res.status(500).json({ error: "Webhook processing failed" });
  } finally {
    client.release();
  }
}
