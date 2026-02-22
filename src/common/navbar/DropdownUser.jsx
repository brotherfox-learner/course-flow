
import { useAuth } from "@/context/AuthContext";
import { User, BookOpen, ClipboardCheck, Star, LogOut } from "lucide-react";


function DropdownUser() {
    const styleButton = "w-full flex flex-row items-center gap-3 body3 text-gray-700 py-[8px] px-[14px] cursor-pointer"
    const {logout} = useAuth()

    return (
        <div className="absolute right-0 top-17 lg:right-2 lg:top-13 py-[8px] min-w-[198px] bg-white rounded-lg shadow-2">
            <button className={styleButton}>
                <User size={16} color="#8DADE0" strokeWidth={2} />
                <span>Profile</span>
            </button>
            <button className={styleButton}>
                <BookOpen size={16} color="#8DADE0" strokeWidth={2} />
                <span>My Courses</span>
            </button>
            <button className={styleButton}>
                <ClipboardCheck size={16} color="#8DADE0" strokeWidth={2} />
                <span>My Assignments</span>
            </button>
            <button className={styleButton}>
                <Star size={16} color="#8DADE0" strokeWidth={2} />
                <span>My Wishlist</span>
            </button>
            <hr />
            <button className={styleButton} onClick={logout}>
                <LogOut size={16} color="#646D89" strokeWidth={2} />
                <span>Log out</span>
            </button>
        </div>
    )
}

export default DropdownUser