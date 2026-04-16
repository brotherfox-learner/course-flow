/** Omise Thailand card/source minimum charge (THB). */
export const OMISE_MIN_CHARGE_THB = 20

function round2(n) {
  return Math.round(Number(n) * 100) / 100
}

/**
 * Clamp post-discount amount so Omise always receives >= OMISE_MIN_CHARGE_THB when possible.
 * If course price is below the minimum, result is the course price (caller may still reject for Omise).
 *
 * @param {number} coursePriceThb
 * @param {number} amountAfterNominalDiscountThb - price after applying promo math (may be < min)
 * @returns {{ finalAmountThb: number, effectiveDiscountThb: number, discountCappedToMinimum: boolean }}
 */
export function resolveChargeAfterPromo(coursePriceThb, amountAfterNominalDiscountThb) {
  const price = round2(coursePriceThb)
  const naive = round2(amountAfterNominalDiscountThb)
  if (!Number.isFinite(price) || price < 0) {
    return {
      finalAmountThb: 0,
      effectiveDiscountThb: 0,
      discountCappedToMinimum: false,
    }
  }
  const raised = Math.max(OMISE_MIN_CHARGE_THB, naive)
  const finalAmountThb = round2(Math.min(price, raised))
  const effectiveDiscountThb = round2(price - finalAmountThb)
  const discountCappedToMinimum =
    price >= OMISE_MIN_CHARGE_THB && naive < OMISE_MIN_CHARGE_THB && finalAmountThb === OMISE_MIN_CHARGE_THB

  return { finalAmountThb, effectiveDiscountThb, discountCappedToMinimum }
}
