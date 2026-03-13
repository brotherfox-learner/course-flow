import { AdminSidebar } from "./AdminSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function AdminLayout({ children, className }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <AdminSidebar />
        <main className={`flex-1 p-0 ${className}`}>
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
