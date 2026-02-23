import { useState, useCallback, forwardRef, useImperativeHandle } from "react";

const PaymentForm = forwardRef(function PaymentForm({
  paymentMethod,
  onPaymentMethodChange,
  onSubmitCard,
  onSubmitPromptPay,
  isLoading,
}, ref) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState({});

  // Format card number with spaces
  const formatCardNumber = useCallback((value) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }, []);

  // Format expiry as MM/YY
  const formatExpiry = useCallback((value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) {
      return digits.slice(0, 2) + "/" + digits.slice(2);
    }
    return digits;
  }, []);

  const handleCardNumberChange = (e) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e) => {
    setExpiry(formatExpiry(e.target.value));
  };

  const handleCvvChange = (e) => {
    setCvv(e.target.value.replace(/\D/g, "").slice(0, 3));
  };

  const validate = () => {
    const newErrors = {};
    const digits = cardNumber.replace(/\s/g, "");

    if (!digits || digits.length < 13) {
      newErrors.cardNumber = "Please enter a valid card number";
    }
    if (!cardName.trim()) {
      newErrors.cardName = "Please enter the name on card";
    }
    if (!expiry || expiry.length < 5) {
      newErrors.expiry = "Please enter a valid expiry date";
    }
    if (!cvv || cvv.length < 3) {
      newErrors.cvv = "Please enter a valid CVV";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === "card") {
      if (!validate()) return;
      const [month, year] = expiry.split("/");
      onSubmitCard({
        number: cardNumber.replace(/\s/g, ""),
        name: cardName,
        expiration_month: parseInt(month, 10),
        expiration_year: parseInt("20" + year, 10),
        security_code: cvv,
      });
    } else {
      onSubmitPromptPay();
    }
  };

  // Expose submit to parent via ref
  useImperativeHandle(ref, () => ({
    submit: handlePlaceOrder,
  }));

  return (
    <div className="flex-1 lg:max-w-[600px]">
      {/* Credit/Debit Card Option */}
      <div
        className={`w-full border rounded-lg p-4 sm:p-6 lg:p-6 mb-4 cursor-pointer transition-all overflow-hidden ${
          paymentMethod === "card"
            ? "border-blue-500 shadow-1 bg-gray-200"
            : "border-gray-300 bg-white"
        }`}
        onClick={() => onPaymentMethodChange("card")}
      >
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="paymentMethod"
            value="card"
            checked={paymentMethod === "card"}
            onChange={() => onPaymentMethodChange("card")}
            className="w-5 h-5 accent-blue-500"
          />
          <span className="body2 font-medium text-gray-800">
            Credit card / Debit card
          </span>
        </label>

        {paymentMethod === "card" && (
          <div className="space-y-4 mt-4">
            {/* Card Number */}
            <div>
              <label className="block body3 font-medium text-gray-900 mb-1">
                Card number
              </label>
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-3 min-w-0">
                <input
                  type="text"
                  placeholder="Card number"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  className={`flex-1 min-w-0 h-12 px-3 sm:px-4 lg:px-4 border rounded-lg body2 text-gray-900 placeholder-gray-400 outline-none bg-white focus:border-blue-500 transition-colors ${
                    errors.cardNumber ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <div className="flex items-center gap-1 sm:gap-2 lg:gap-2 flex-shrink-0">
                  {/* Visa */}
                  <svg className="w-8 h-5 sm:w-10 sm:h-6 lg:w-10 lg:h-6" viewBox="0 0 40 26" fill="none">
                    <rect
                      width="40"
                      height="26"
                      rx="4"
                      fill="#EEEEEE"
                    />
                    <path
                      d="M17.4 17.5H15.2L16.6 8.5H18.8L17.4 17.5ZM13.6 8.5L11.5 14.7L11.2 13.3L11.2 13.3L10.4 9.2C10.4 9.2 10.3 8.5 9.4 8.5H6.1L6 8.6C6 8.6 7.1 8.8 8.3 9.6L10.2 17.5H12.5L16 8.5H13.6ZM29.6 17.5H31.6L29.9 8.5H28.1C27.4 8.5 27.2 9 27.2 9L23.9 17.5H26.2L26.7 16.1H29.4L29.6 17.5ZM27.3 14.3L28.5 10.9L29.2 14.3H27.3ZM24.5 10.8L24.8 9C24.8 9 23.8 8.5 22.7 8.5C21.5 8.5 18.8 9.1 18.8 11.5C18.8 13.7 21.9 13.7 21.9 14.9C21.9 16.1 19.2 15.7 18.3 15.1L18 16.9C18 16.9 19 17.5 20.5 17.5C22 17.5 24.4 16.5 24.4 14.3C24.4 12 21.3 11.8 21.3 10.8C21.3 9.8 23.4 10 24.5 10.8Z"
                      fill="#1A1F71"
                    />
                  </svg>
                  {/* Mastercard */}
                  <svg className="w-8 h-5 sm:w-10 sm:h-6 lg:w-10 lg:h-6" viewBox="0 0 40 26" fill="none">
                    <rect
                      width="40"
                      height="26"
                      rx="4"
                      fill="#EEEEEE"
                    />
                    <circle cx="16" cy="13" r="7" fill="#EB001B" />
                    <circle cx="24" cy="13" r="7" fill="#F79E1B" />
                    <path
                      d="M20 7.8C21.5 9 22.4 10.9 22.4 13C22.4 15.1 21.5 17 20 18.2C18.5 17 17.6 15.1 17.6 13C17.6 10.9 18.5 9 20 7.8Z"
                      fill="#FF5F00"
                    />
                  </svg>
                </div>
              </div>
              {errors.cardNumber && (
                <p className="text-red-500 body4 mt-1">{errors.cardNumber}</p>
              )}
            </div>

            {/* Name on card */}
            <div>
              <label className="block body3 font-medium text-gray-900 mb-1">
                Name on card
              </label>
              <input
                type="text"
                placeholder="Name on card"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className={`w-full h-12 px-3 sm:px-4 lg:px-4 border rounded-lg body2 text-gray-900 placeholder-gray-400 outline-none bg-white focus:border-blue-500 transition-colors ${
                  errors.cardName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.cardName && (
                <p className="text-red-500 body4 mt-1">{errors.cardName}</p>
              )}
            </div>

            {/* Expiry date & CVV */}
            <div className="flex gap-2 sm:gap-4 lg:gap-4">
              <div className="flex-1">
                <label className="block body3 font-medium text-gray-900 mb-1">
                  Expiry date
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={handleExpiryChange}
                  className={`w-full h-12 px-3 sm:px-4 lg:px-4 border rounded-lg body2 text-gray-900 placeholder-gray-400 outline-none bg-white focus:border-blue-500 transition-colors ${
                    errors.expiry ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.expiry && (
                  <p className="text-red-500 body4 mt-1">{errors.expiry}</p>
                )}
              </div>
              <div className="flex-1">
                <label className="block body3 font-medium text-gray-900 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  placeholder="CVV"
                  value={cvv}
                  onChange={handleCvvChange}
                  className={`w-full h-12 px-3 sm:px-4 lg:px-4 border rounded-lg body2 text-gray-900 placeholder-gray-400 outline-none bg-white focus:border-blue-500 transition-colors ${
                    errors.cvv ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.cvv && (
                  <p className="text-red-500 body4 mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Payment Option */}
      <div
        className={`w-full border rounded-lg p-4 sm:p-6 lg:min-w-[464px] xl:min-w-[564px] lg:p-6 cursor-pointer transition-all overflow-hidden ${
          paymentMethod === "promptpay"
            ? "border-blue-500 bg-gray-200 shadow-1"
            : "border-gray-300 bg-white"
        }`}
        onClick={() => onPaymentMethodChange("promptpay")}
      >
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="paymentMethod"
            value="promptpay"
            checked={paymentMethod === "promptpay"}
            onChange={() => onPaymentMethodChange("promptpay")}
            className="w-5 h-5 accent-blue-500"
          />
          <span className="body2 font-medium text-gray-900">QR Payment</span>
        </label>
      </div>

    </div>
  );
});

export default PaymentForm;
