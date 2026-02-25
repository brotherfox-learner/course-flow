import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export function UserProfile({ profile, onToggle, isLoading }) {
  const firstInitial = profile?.firstName?.charAt(0)?.toUpperCase() || "?"

  if (isLoading) return <SkeletonDemo />

  return (
    <div className="flex flex-row items-center lg:py-2 lg:gap-4">
      <Link href="/profile" className="cursor-pointer">
        <Avatar className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage src={profile?.avatarUrl} alt={profile?.firstName} className="object-cover" />
          <AvatarFallback>{firstInitial}</AvatarFallback>
        </Avatar>
      </Link>

      <button onClick={onToggle} className="hidden lg:flex items-center gap-2 cursor-pointer">
        <span className="body2 text-gray-800">
          {profile?.firstName} {profile?.lastName}
        </span>
        <ChevronDown size={24} color="#646D89" strokeWidth={1} />
      </button>
    </div>
  )
}

export default UserProfile

function SkeletonDemo() {
  return (
    <div className="flex items-center gap-4 py-2">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="hidden lg:block">
        <Skeleton className="h-4 w-[150px] bg-gray-400" />
      </div>
    </div>
  )
}