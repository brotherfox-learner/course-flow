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
      `SELECT p.id, p.status, p.course_id, c.slug as course_slug, c.course_name
       FROM payments p
       JOIN courses c ON c.id = p.course_id
       WHERE p.provider_charge_id = $1`,
      [chargeId]
    );

    const payment = paymentResult.rows[0] || null;

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
