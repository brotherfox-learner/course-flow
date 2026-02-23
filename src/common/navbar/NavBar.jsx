import Link from "next/link";
import Button from "./Button"
import BrandLogo from "./BrandLogo"
import UserProfile from "./UserProfile"
import DropdownUser from "./DropdownUser"
import { useToggle } from "@/hooks/useToggle"
import { useAuth } from "@/context/AuthContext"
import { useEffect } from "react"
import router from "next/router"

function NavBar() {
    const { isShow, switchToggle, reset } = useToggle()
    const { user, profile } = useAuth()

    useEffect(() => {
        if (!user) reset();
    }, [user]);

    return (
        <nav className="sticky top-0 z-100 shadow-2 flex flex-row items-center justify-between bg-white px-4 py-3 lg:px-40">
            <BrandLogo />
            <div className="flex flex-row gap-2 lg:gap-12">
                <Button onClick={() => router.push("/courses")} variant="ghost" size="ghost" className="text-dark-blue-500!">Our Courses</Button>
                {user ? (
                    <UserProfile profile={profile} onToggle={switchToggle} />
                ) : (
                    <Link href="/login">
                        <Button variant="primary" size="md">Log in</Button>
                    </Link>
                )}
                {user && isShow && <DropdownUser />}
            </div>
        </nav>
    )
}

export default NavBar