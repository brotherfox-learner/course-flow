import { AdminSidebar } from "./AdminSidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { useAuth } from "@/context/AuthContext"

export default function AdminLayout({ children, className }) {
  const router = useRouter()
  const { isLoggedIn, loading, profile } = useAuth()

  useEffect(() => {
    if (loading) return

    // ถ้ายังไม่ล็อกอิน หรือไม่ใช่ admin ให้เด้งไปหน้า login
    if (!isLoggedIn || !profile || profile.role !== "admin") {
      router.push("/admin/login")
    }
  }, [loading, isLoggedIn, profile, router])

  // ระหว่างโหลด หรือระหว่าง redirect ยังไม่ให้เห็นหน้า admin
  if (loading || !isLoggedIn || !profile || profile.role !== "admin") {
    return (
      <section className="min-h-screen flex items-center justify-center bg-[#F6F7FC]">
        <article className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to admin login...</p>
        </article>
      </section>
    )
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className={`p-0 bg-[#F6F7FC] ${className}`}>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
