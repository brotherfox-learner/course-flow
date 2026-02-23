import pool from "../../../utils/db";

/**
 * Omise webhook endpoint.
 * หมายเหตุ: ถ้าไม่เห็น row ใน payment_webhooks เลย ให้เช็ค
 * 1. รันบน localhost หรือไม่ — Omise ส่งได้แค่ URL สาธารณะ (HTTPS) ต้องใช้ ngrok หรือ deploy
 * 2. charge.complete — Omise จะส่ง charge.complete เฉพาะ 3DS หรือ Internet Banking (เช่น PromptPay)
 *    การชำระบัตรแบบไม่ผ่าน 3DS จะไม่ trigger webhook นี้
 * 3. ใน Omise Dashboard (Test/Live) ตั้ง Webhook URL = https://your-domain.com/api/webhooks/omise
 */
export const config = {
  api: {
    bodyParser: true,
  },
};

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

          // สร้าง enrollment
          await client.query(
            `INSERT INTO enrollments (user_id, course_id, status, enrolled_at, updated_at)
             VALUES ($1, $2, 'active', NOW(), NOW())
             ON CONFLICT (user_id, course_id) DO NOTHING`,
            [user_id, course_id]
          );
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
