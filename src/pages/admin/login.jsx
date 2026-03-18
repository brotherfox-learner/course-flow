import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { AdminLoginForm } from "@/features/login/components/AdminLoginForm"
import { useAuth } from "@/features/auth/context/AuthContext"

export default function AdminLoginPage() {
  const router = useRouter()
  const { profile, isLoggedIn, loading } = useAuth()

  useEffect(() => {
    // Redirect if already logged in
    if (!loading && isLoggedIn && profile) {
      if (profile.role === 'admin') {
        // Admin user - redirect to admin dashboard
        router.push('/admin/courses')
      } else {
        // Non-admin user - redirect to home page
        router.push('/')
      }
    }
  }, [profile, isLoggedIn, loading, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If logged in and not admin, show redirect message
  if (isLoggedIn && profile && profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access the admin panel.</p>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Admin Login | CourseFlow</title>
      </Head>
      <AdminLoginForm />
    </>
  )
}
