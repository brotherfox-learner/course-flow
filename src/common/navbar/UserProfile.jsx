import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


export function UserProfile({ user, onToggle }) {
  const firstInitial = user?.firstName?.charAt(0)?.toUpperCase() || "?"

  return (
    <div className="flex flex-row items-center lg:py-3 lg:gap-4">
      <Avatar className="w-10 h-10">
        <AvatarFallback>{firstInitial}</AvatarFallback>
      </Avatar>
      <span className="hidden lg:block body2 text-gray-800 self-center">{user.firstName} {user.lastName}</span>
      <button onClick={onToggle}>
        <ChevronDown size={24} color="#646D89" strokeWidth={1} />
      </button>
    </div>
  )
}

export default UserProfile
