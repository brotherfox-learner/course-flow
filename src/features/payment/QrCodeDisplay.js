import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";

export default function QrCodeDisplay({ qrCodeUri, chargeId, amount, courseSlug }) {
  const router = useRouter();
  const [status, setStatus] = useState("pending");
  const intervalRef = useRef(null);

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
          // Redirect to success page
          router.push(
            `/payment/complete?status=success&courseSlug=${courseSlug}`
          );
        } else if (data.status === "failed" || data.status === "expired") {
          setStatus("failed");
          clearInterval(intervalRef.current);
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header placeholder */}
      <div className="bg-white shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-[160px] py-4 flex items-center justify-between">
          <span className="text-blue-500 font-bold text-xl italic">
            CourseFlow
          </span>
        </div>
      </div>

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
          <p className="body3 text-gray-600 mb-4">
            Reference no. CF{Date.now().toString().slice(-10)}
          </p>

          {/* Amount */}
          <p className="text-orange-500 headline3 font-semibold mb-6">
            THB{" "}
            {(amount || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>

          {/* QR Image */}
          <div className="w-[200px] h-[200px] mx-auto mb-8 flex items-center justify-center">
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

          {/* Status indicator */}
          {status === "pending" && (
            <p className="body3 text-gray-500 mb-4 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              Waiting for payment...
            </p>
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
  );
}
