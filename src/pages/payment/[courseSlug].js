import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import PaymentForm from "../../features/payment/PaymentForm";
import OrderSummary from "../../features/payment/OrderSummary";
import QrCodeDisplay from "../../features/payment/QrCodeDisplay";
import pool from "../../utils/db";
import NavBar from "../../common/navbar/NavBar";
import Footer from "../../common/Footer";
import { useAuth } from "../../context/AuthContext";

export async function getServerSideProps(context) {
  // รับ courseSlug จาก URL 
  const { courseSlug } = context.params;

  try {
    // ดึงข้อมูลคอร์สจากฐานข้อมูล
    const result = await pool.query(
      "SELECT id, course_name, slug, price, course_summary, cover_img_url FROM courses WHERE slug = $1",
      [courseSlug]
    );

    // ถ้าไม่พบคอร์ส แสดงข้อความว่า "Course not found"
    if (result.rows.length === 0) {
      return { notFound: true };
    }

    // เก็บข้อมูลคอร์สในตัวแปร course
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
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ต้องล็อกอินถึงจะจ่ายได้ — redirect ไป login ถ้ายังไม่ล็อกอิน
  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
  }, [isLoggedIn, authLoading, router]);

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
          userId: user?.id,
          promoCode: promoCode || null,
          paymentMethod: "card",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail = data.failureMessage || data.error || "Payment failed";
        throw new Error(detail);
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
          userId: user?.id,
          promoCode: promoCode || null,
          paymentMethod: "promptpay",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail = data.failureMessage || data.error || "Payment failed";
        throw new Error(detail);
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

  // รอ auth หรือ redirect ไป login — ไม่แสดงฟอร์มจ่ายก่อนล็อกอิน
  if (authLoading || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="body2 text-gray-600">กำลังโหลด...</p>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-6 sm:py-8 lg:py-12">
        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-500 body2 font-medium hover:underline mb-3 sm:mb-4"
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
        <div className="headline3 text-gray-900 mb-6 sm:mb-8 lg:mb-10">
          Enter payment info to start
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>your subscription
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="body2 text-red-600">{error}</p>
          </div>
        )}
        <p className="text-gray-700 body2 mb-4 sm:mb-6">Select payment method</p>
        {/* Layout: Form + Summary */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 xl:gap-12">
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

      <Footer />
    </div>
  );
}
