import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import NavBar from "@/common/navbar/NavBar";
const QR_EXPIRY_MINUTES = 15;

export default function QrCodeDisplay({ qrCodeUri, chargeId, amount, courseSlug }) {
  const router = useRouter();
  const [status, setStatus] = useState("pending");
  const intervalRef = useRef(null);

  // Countdown timer state (15 minutes in seconds)
  const [timeLeft, setTimeLeft] = useState(QR_EXPIRY_MINUTES * 60);
  const timerRef = useRef(null);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // หมดเวลา → redirect ไปหน้า failed
          clearInterval(timerRef.current);
          clearInterval(intervalRef.current);
          router.push(
            `/payment/complete?status=failed&courseSlug=${courseSlug}`
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [courseSlug, router]);

  // Poll for payment status every 5 seconds
  useEffect(() => {
    if (!chargeId) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/checkout/status?chargeId=${chargeId}`);
        const data = await res.json();

        if (data.status === "successful") {
          setStatus("successful");
          clearInterval(intervalRef.current);
          clearInterval(timerRef.current);
          // Redirect to success page
          router.push(
            `/payment/complete?status=success&courseSlug=${courseSlug}`
          );
        } else if (data.status === "failed" || data.status === "expired") {
          setStatus("failed");
          clearInterval(intervalRef.current);
          clearInterval(timerRef.current);
          router.push(
            `/payment/complete?status=failed&courseSlug=${courseSlug}`
          );
        }
      } catch (error) {
        console.error("Status polling error:", error);
      }
    };

    // Check immediately, then every 5s
    checkStatus();
    intervalRef.current = setInterval(checkStatus, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [chargeId, courseSlug, router]);

  const handleSaveQR = () => {
    if (qrCodeUri) {
      window.open(qrCodeUri, "_blank");
    }
  };

  // คำนวณ progress สำหรับ timer ring (0 = หมดเวลา, 1 = เต็ม)
  const progress = timeLeft / (QR_EXPIRY_MINUTES * 60);
  const isUrgent = timeLeft <= 60; // สีแดงเมื่อเหลือไม่ถึง 1 นาที

  return (
    <>
    <NavBar />
    <div className="min-h-screen bg-gray-100">


      {/* Back link */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[160px] pt-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-500 body2 font-medium hover:underline"
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
      </div>

      {/* QR Display Card */}
      <div className="max-w-[739px] mx-auto mt-8 mb-16 px-6">
        <div className="bg-white rounded-lg shadow-1 p-8 lg:p-12 flex flex-col items-center">
          <h2 className="headline3 text-gray-900 mb-1">Scan QR code</h2>
          {chargeId && (
            <p className="body3 text-gray-600 mb-4">
              Reference no. {chargeId}
            </p>
          )}

          {/* Amount */}
          <p className="text-orange-500 headline3 font-semibold mb-6">
            THB{" "}
            {(amount || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>

          {/* QR Image */}
          <div className="w-[200px] h-[200px] mx-auto mb-6 flex items-center justify-center">
            {qrCodeUri ? (
              <img
                src={qrCodeUri}
                alt="PromptPay QR Code"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="body3 text-gray-500">Loading QR...</p>
              </div>
            )}
          </div>

          {/* Countdown Timer */}
          {status === "pending" && (
            <div className="flex flex-col items-center mb-6">
              {/* Circular progress ring */}
              <div className="relative w-20 h-20 mb-3">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  {/* Background circle */}
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="6"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke={isUrgent ? "#EF4444" : "#3B82F6"}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 35}`}
                    strokeDashoffset={`${2 * Math.PI * 35 * (1 - progress)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                {/* Time text in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={`text-sm font-semibold ${
                      isUrgent ? "text-red-500" : "text-gray-900"
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* Status text */}
              <p className="body3 text-gray-500 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                Waiting for payment...
              </p>
              {isUrgent && (
                <p className="body4 text-red-500 mt-1">
                  QR code is about to expire!
                </p>
              )}
            </div>
          )}

          {/* Save QR button */}
          <button
            onClick={handleSaveQR}
            className="w-full max-w-[400px] h-[60px] bg-blue-500 hover:bg-blue-600 text-white headline3 rounded-xl transition-colors"
          >
            Save QR image
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
