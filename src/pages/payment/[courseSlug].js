import { useState, useRef } from "react";
import { useRouter } from "next/router";
import PaymentForm from "../../features/payment/PaymentForm";
import OrderSummary from "../../features/payment/OrderSummary";
import QrCodeDisplay from "../../features/payment/QrCodeDisplay";
import pool from "../../utils/db";

// Hardcoded user ID for now (auth will be added later)
const TEMP_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function getServerSideProps(context) {
  const { courseSlug } = context.params;

  try {
    const result = await pool.query(
      "SELECT id, course_name, slug, price, course_summary, cover_img_url FROM courses WHERE slug = $1",
      [courseSlug]
    );

    if (result.rows.length === 0) {
      return { notFound: true };
    }

    const course = result.rows[0];

    return {
      props: {
        course: {
          id: course.id,
          courseName: course.course_name,
          slug: course.slug,
          price: parseFloat(course.price),
          summary: course.course_summary,
          coverImgUrl: course.cover_img_url,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching course:", error);
    return { notFound: true };
  }
}

export default function PaymentPage({ course }) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  // QR display state
  const [showQr, setShowQr] = useState(false);
  const [qrData, setQrData] = useState(null);

  // Ref for PaymentForm to trigger submit from OrderSummary
  const paymentFormRef = useRef(null);

  const finalAmount = Math.max(0, course.price - promoDiscount);

  // Apply promo code
  const handleApplyPromoCode = async (code) => {
    if (!code.trim()) return;

    setPromoLoading(true);
    setPromoError("");

    try {
      const res = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, coursePrice: course.price }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPromoError(data.error);
        setPromoDiscount(0);
        setPromoCode("");
        return;
      }

      setPromoCode(code);
      setPromoDiscount(data.discountAmount);
      setPromoError("");
    } catch (err) {
      setPromoError("Failed to validate promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  // Handle card payment
  const handleCardSubmit = async (cardData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create token via Omise.js
      if (typeof window === "undefined" || !window.Omise) {
        throw new Error("Omise.js is not loaded");
      }

      window.Omise.setPublicKey(process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY);

      const token = await new Promise((resolve, reject) => {
        window.Omise.createToken("card", cardData, (statusCode, response) => {
          if (statusCode !== 200 || response.object === "error") {
            reject(
              new Error(response.message || "Failed to create card token")
            );
          } else {
            resolve(response.id);
          }
        });
      });

      // Step 2: Send token to our checkout API
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          courseId: course.id,
          userId: TEMP_USER_ID,
          promoCode: promoCode || null,
          paymentMethod: "card",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      if (data.status === "successful") {
        router.push(
          `/payment/complete?status=success&courseSlug=${course.slug}`
        );
      } else {
        router.push(
          `/payment/complete?status=failed&courseSlug=${course.slug}`
        );
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Handle PromptPay payment
  const handlePromptPaySubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (typeof window === "undefined" || !window.Omise) {
        throw new Error("Omise.js is not loaded");
      }

      window.Omise.setPublicKey(process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY);

      // Step 1: Create source via Omise.js
      const amountInSatang = Math.round(finalAmount * 100);

      const sourceId = await new Promise((resolve, reject) => {
        window.Omise.createSource(
          "promptpay",
          {
            amount: amountInSatang,
            currency: "THB",
          },
          (statusCode, response) => {
            if (statusCode !== 200 || response.object === "error") {
              reject(
                new Error(response.message || "Failed to create PromptPay source")
              );
            } else {
              resolve(response.id);
            }
          }
        );
      });

      // Step 2: Send source to our checkout API
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          courseId: course.id,
          userId: TEMP_USER_ID,
          promoCode: promoCode || null,
          paymentMethod: "promptpay",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      // Show QR code
      setQrData({
        qrCodeUri: data.qrCodeUri,
        chargeId: data.chargeId,
        amount: data.amount,
      });
      setShowQr(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle place order from OrderSummary button
  const handlePlaceOrder = () => {
    if (paymentMethod === "card") {
      // Trigger card form validation + submit via ref
      paymentFormRef.current?.submit();
    } else {
      handlePromptPaySubmit();
    }
  };

  // If showing QR code, render QR display
  if (showQr && qrData) {
    return (
      <QrCodeDisplay
        qrCodeUri={qrData.qrCodeUri}
        chargeId={qrData.chargeId}
        amount={qrData.amount}
        courseSlug={course.slug}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-[160px] py-4 flex items-center justify-between">
          <span className="text-blue-500 font-bold text-xl italic">
            CourseFlow
          </span>
          <nav className="flex items-center gap-8">
            <a
              href="/"
              className="body2 text-gray-700 hover:text-blue-500 transition-colors"
            >
              Our Courses
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[160px] py-8 lg:py-12">
        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-500 body2 font-medium hover:underline mb-4"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>

        {/* Page Title */}
        <h1 className="headline2 text-gray-900 mb-8">
          Enter payment info to start
          <br />
          your subscription
        </h1>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="body2 text-red-600">{error}</p>
          </div>
        )}

        {/* Layout: Form + Summary */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
          <PaymentForm
            ref={paymentFormRef}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            onSubmitCard={handleCardSubmit}
            onSubmitPromptPay={handlePromptPaySubmit}
            isLoading={isLoading}
          />

          <OrderSummary
            courseName={course.courseName}
            coursePrice={course.price}
            paymentMethod={paymentMethod}
            promoDiscount={promoDiscount}
            promoCode={promoCode}
            onApplyPromoCode={handleApplyPromoCode}
            onPlaceOrder={handlePlaceOrder}
            isLoading={isLoading}
            promoError={promoError}
            promoLoading={promoLoading}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-800 mt-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-[160px] py-8 flex flex-col lg:flex-row items-center justify-between gap-4">
          <span className="text-white font-bold text-xl italic">
            CourseFlow
          </span>
          <div className="flex items-center gap-6">
            <a href="/" className="body3 text-gray-300 hover:text-white">
              All Courses
            </a>
            <a href="/" className="body3 text-gray-300 hover:text-white">
              Bundle Package
            </a>
          </div>
          <div className="flex items-center gap-3">
            {/* Social icons */}
            <a
              href="#"
              className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
            >
              <svg
                width="16"
                height="16"
                fill="white"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="#"
              className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
            >
              <svg
                width="16"
                height="16"
                fill="white"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a
              href="#"
              className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
            >
              <svg
                width="16"
                height="16"
                fill="white"
                viewBox="0 0 24 24"
              >
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
