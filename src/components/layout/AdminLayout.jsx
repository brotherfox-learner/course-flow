import { AdminSidebar } from "./AdminSidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function AdminLayout({ children, className }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className={`p-0 bg-[#F6F7FC] ${className}`}>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
