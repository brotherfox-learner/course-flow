import { useState } from "react";

export default function OrderSummary({
  courseName,
  coursePrice,
  paymentMethod,
  promoDiscount,
  promoCode,
  onApplyPromoCode,
  onPlaceOrder,
  isLoading,
  promoError,
  promoLoading,
}) {
  const [promoInput, setPromoInput] = useState(promoCode || "");

  const subtotal = parseFloat(coursePrice) || 0;
  const discount = parseFloat(promoDiscount) || 0;
  const total = Math.max(0, subtotal - discount);

  const paymentMethodLabel =
    paymentMethod === "card" ? "Credit card / Debit card" : "QR Payment";

  return (
    <div className="w-full lg:w-[400px] xl:w-[440px] bg-white rounded-lg shadow-1 p-4 sm:p-6 lg:p-6 py-6 sm:py-8 lg:py-8 h-fit lg:sticky lg:top-6 flex-shrink-0">
      {/* Summary Header */}
      <p className="text-orange-500 body3 font-medium mb-1">Summary</p>

      {/* Subscription Label */}
      <p className="text-gray-700 body3 mb-1">Subscription</p>
      <h3 className="headline3 text-gray-900 mb-4">{courseName}</h3>

      {/* Promo Code */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Promo code"
          value={promoInput}
          onChange={(e) => setPromoInput(e.target.value)}
          className="flex-1 h-10 px-3 border border-gray-300 rounded-lg body3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
        />
        <button
          onClick={() => onApplyPromoCode(promoInput)}
          disabled={promoLoading || !promoInput.trim()}
          className="px-5 h-10 bg-blue-500 hover:bg-blue-600 text-white body3 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {promoLoading ? "..." : "Apply"}
        </button>
      </div>
      {promoError && (
        <p className="text-red-500 body4 mb-3 -mt-2">{promoError}</p>
      )}

      {/* Price Breakdown */}
      <div className="space-y-2 border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center">
          <span className="body2 text-gray-700">Subtotal</span>
          <span className="body2 text-gray-900">
            {subtotal.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between items-center">
            <span className="body2 text-gray-700">Discount</span>
            <span className="body2 text-orange-500">
              -
              {discount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="body2 text-gray-700">Payment method</span>
          <span className="body2 text-gray-900 text-right">
            {paymentMethodLabel}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-4 mb-6">
        <span className="body2 text-gray-700">Total</span>
        <span className="headline3 text-blue-500 font-semibold">
          THB{" "}
          {total.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>

      {/* Place Order Button */}
      <button
        onClick={onPlaceOrder}
        disabled={isLoading}
        className="w-full h-[60px] bg-blue-500 hover:bg-blue-600 text-white headline3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed "
      >
        {isLoading ? "Processing..." : "Place order"}
      </button>
    </div>
  );
}
