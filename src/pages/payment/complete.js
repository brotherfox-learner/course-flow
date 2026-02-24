import { useRouter } from "next/router";
import NavBar from "@/common/navbar/NavBar";

export default function PaymentComplete() {
  const router = useRouter();
  const { status, courseSlug } = router.query;

  const isSuccess = status === "success";

  return (
    <>
    <NavBar />
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 relative overflow-hidden">
        {/* Decorative elements */}
        {isSuccess && (
          <>
            <div className="absolute top-20 left-16 w-3 h-3 bg-blue-300 rounded-full opacity-60"></div>
            <div className="absolute top-28 left-8 w-8 h-8 bg-blue-200 rounded-full opacity-40"></div>
            <div className="absolute top-32 left-40 text-green-400 text-2xl opacity-60">✦</div>
            <div className="absolute top-24 right-20 text-orange-300 text-xl opacity-60">▽</div>
            <div className="absolute top-28 right-4 w-10 h-10 bg-blue-200 rounded-full opacity-30"></div>
          </>
        )}
        {!isSuccess && (
          <>
            <div className="absolute top-20 left-16 w-3 h-3 bg-blue-300 rounded-full opacity-60"></div>
            <div className="absolute top-28 left-8 w-8 h-8 bg-blue-200 rounded-full opacity-40"></div>
            <div className="absolute top-32 left-40 text-green-400 text-2xl opacity-60">✦</div>
            <div className="absolute top-24 right-20 text-orange-300 text-xl opacity-60">▽</div>
            <div className="absolute top-28 right-4 w-10 h-10 bg-blue-200 rounded-full opacity-30"></div>
          </>
        )}

        <div className="bg-white rounded-lg shadow-1 p-12 lg:p-16 max-w-[530px] w-full text-center relative z-10">
          {isSuccess ? (
            <>
              {/* Success Icon */}
              <div className="w-16 h-16 mx-auto mb-6 bg-green rounded-full flex items-center justify-center">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Success Message */}
              <h2 className="headline3 text-gray-900 mb-2">
                Thank you for subscribing.
              </h2>
              <p className="body2 text-gray-600 mb-8">
                Your payment is complete. You can start learning the course now.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() =>
                    router.push(courseSlug ? `/my-courses` : "/")
                  }
                  className="px-8 py-3 border-2 border-orange-500 text-orange-500 body2 font-medium rounded-xl hover:bg-orange-50 transition-colors"
                >
                  View Course detail
                </button>
                <button
                  onClick={() =>
                    router.push(
                      courseSlug ? `/courses/${courseSlug}/learn` : "/"
                    )
                  }
                  className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white body2 font-medium rounded-xl transition-colors"
                >
                  Start Learning
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Failed Icon */}
              <div className="w-16 h-16 mx-auto mb-6 bg-purple-600 rounded-full flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Failed Message */}
              <h2 className="headline3 text-gray-900 mb-2">Payment failed.</h2>
              <p className="body2 text-gray-600 mb-8">
                Please check your payment details and try again
              </p>

              {/* Back Button */}
              <button
                onClick={() =>
                  router.push(
                    courseSlug ? `/payment/${courseSlug}` : "/"
                  )
                }
                className="w-full max-w-[400px] py-3 bg-blue-500 hover:bg-blue-600 text-white body2 font-medium rounded-xl transition-colors"
              >
                Back to Payment
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-800">
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
            <a
              href="#"
              className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
            >
              <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="#"
              className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
            >
              <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a
              href="#"
              className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
            >
              <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
