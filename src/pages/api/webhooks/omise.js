import pool from "../../../utils/db";

// Disable body parsing — we need the raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const client = await pool.connect();

  try {
    const event = req.body;
    const eventKey = event.key; // e.g. "charge.complete"
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

        if (paymentResult.rows.length > 0) {
          const { user_id, course_id } = paymentResult.rows[0];

          await client.query(
            `INSERT INTO enrollments (user_id, course_id, status, enrolled_at, updated_at)
             VALUES ($1, $2, 'active', NOW(), NOW())
             ON CONFLICT (user_id, course_id) DO NOTHING`,
            [user_id, course_id]
          );
        }
      } else if (chargeStatus === "failed" || chargeStatus === "expired") {
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

    return res.status(200).json({ received: true });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  } finally {
    client.release();
  }
}
