import Link from "next/link"
import { User, BookOpen, ClipboardCheck, Star, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

function DropdownUser() {
  const { logout } = useAuth()

  const styleButton =
    "flex w-full items-center gap-3 px-4 py-2 body3 text-gray-700 hover:bg-gray-100"

  return (
    <div className="absolute right-0 top-18 lg:right-2 lg:top-[61px] py-2 min-w-[198px] bg-white rounded-lg shadow-2">

      <Link href="/profile" className={styleButton}>
        <User size={16} color="#8DADE0" />
        <span>Profile</span>
      </Link>

      <Link href="/my-courses" className={styleButton}>
        <BookOpen size={16} color="#8DADE0" />
        <span>My Courses</span>
      </Link>

      <Link href="/my-assignments" className={styleButton}>
        <ClipboardCheck size={16} color="#8DADE0" />
        <span>My Assignments</span>
      </Link>

      <Link href="/wishlist" className={styleButton}>
        <Star size={16} color="#8DADE0" />
        <span>My Wishlist</span>
      </Link>

      <hr className="my-1" />

      <Link href="/" className={styleButton} onClick={logout}>
        <LogOut size={16} color="#646D89" />
        <span>Log out</span>
      </Link>
    </div>
  )
}

export default DropdownUser