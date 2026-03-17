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
import { useAuth } from "@/context/AuthContext"

export function AdminSidebar() {
  const router = useRouter()
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)
  const { logout } = useAuth()

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
    try {
      await logout()
      setIsLogoutOpen(false)
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <Sidebar className="border-r border-gray-400 bg-white">
      <SidebarHeader className="px-6 pt-10 pb-6 flex flex-col items-center gap-6">
        <Link href="/" target="_blank" rel="noopener noreferrer" className="block">
          <h1 className="text-[28px] font-bold text-center tracking-tight brand-gradient-text">
            CourseFlow
          </h1>
        </Link>
        <p className="body2 text-gray-700 text-center font-normal">Admin Panel Control</p>
      </SidebarHeader>
      
      <SidebarContent className="mt-10">
        <SidebarMenu className="px-0 gap-0">
          {navigation.map((item) => {
            const isActive = router.pathname.startsWith(item.url)
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  className={`font-medium h-14 rounded-none px-6 gap-4 transition-colors ${
                    isActive 
                      ? "bg-gray-200 text-gray-800" 
                      : "bg-white text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <Link href={item.url} className="flex items-center">
                    <item.icon className="w-6 h-6 mr-4 text-blue-300" />
                    <span className="body2 font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-0 mb-8">
        <SidebarMenu>
          <SidebarMenuItem>
            <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
              <DialogTrigger asChild>
                <SidebarMenuButton 
                  className="font-bold h-14 text-gray-800 hover:bg-gray-100 w-full rounded-none px-6 gap-4"
                >
                  <LogOut className="w-6 h-6 mr-4 text-blue-300" />
                  <span className="body2 font-bold">Log out</span>
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
                  <Button variant="cancel" size="admin" onClick={() => setIsLogoutOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="admin" onClick={handleLogout}>
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
