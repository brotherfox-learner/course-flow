import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BookOpen, ClipboardList, Ticket, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"
import { useState } from "react"

export function AdminSidebar() {
  const router = useRouter()
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)

  const navigation = [
    {
      title: "Course",
      url: "/admin/courses",
      icon: BookOpen,
    },
    {
      title: "Assignment",
      url: "/admin/assignments",
      icon: ClipboardList,
    },
    {
      title: "Promo code",
      url: "/admin/promocodes",
      icon: Ticket,
    },
  ]

  const handleLogout = async () => {
    // TODO: Implement actual logout logic with Supabase (clear session/token)
    localStorage.removeItem("adminToken") // Mock clear session
    setIsLogoutOpen(false)
    router.push("/admin/login")
  }

  return (
    <Sidebar className="border-r border-slate-200 bg-white w-64">
      <SidebarHeader className="p-6 pb-2 mt-4">
        <h1 className="text-[28px] font-bold text-center tracking-tight flex justify-center items-center">
          <span className="text-[#6495ED]">Course</span>
          <span className="text-[#1E3A8A]">Flow</span>
        </h1>
        <p className="text-sm text-slate-500 text-center mt-2 font-medium">Admin Panel Control</p>
      </SidebarHeader>
      
      <SidebarContent className="mt-8">
        <SidebarMenu className="px-4 gap-2">
          {navigation.map((item) => {
            const isActive = router.pathname.startsWith(item.url)
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  className={`font-medium h-12 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-slate-100 text-[#1E3A8A]" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Link href={item.url} className="flex items-center">
                    <item.icon className={`w-[22px] h-[22px] mr-4 ${isActive ? "text-[#1E3A8A]" : "text-[#94A3B8]"}`} />
                    <span className="text-[16px]">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 mb-8">
        <SidebarMenu>
          <SidebarMenuItem>
            <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
              <DialogTrigger asChild>
                <SidebarMenuButton 
                  className="font-medium h-12 text-slate-600 hover:bg-slate-50 hover:text-slate-900 w-full rounded-lg"
                >
                  <LogOut className="w-[22px] h-[22px] mr-4 text-[#94A3B8]" />
                  <span className="text-[16px]">Log out</span>
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Confirmation</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to log out ?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
                  <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600" onClick={() => setIsLogoutOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleLogout}>
                    Yes, I want to log out
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
