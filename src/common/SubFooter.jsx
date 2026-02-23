import Link from "next/link"
import { useAuth } from "@/context/AuthContext"

import Button from "./navbar/Button"
function SubFooter() {
    const { user } = useAuth()


    return (
        <div className="flex flex-col items-center justify-between gap-[24px] py-16 px-4 subfooter-bg min-h-[40vh] lg:flex-row lg:px-40 lg:py-4">
            <div className="flex flex-col items-center gap-[24px] lg:items-start">
                <h3 className="text-[24px] font-medium text-white lg:text-[36px]">Want to start learning?</h3>
                {user ? (
                    <Link href="/courses">
                        <Button variant="secondary" size="lg">Check out our courses</Button>
                    </Link>
                ) : (
                    <Link href="/register">
                        <Button variant="secondary" size="lg">Register here</Button>
                    </Link>
                )}
            </div>
            <div className="relative lg:self-end">
                <img
                    src="/learning.svg"
                    alt="learning"
                    className="w-[70vw] lg:w-[40vw]"
                />
                <img
                    src="/white_polygon.svg"
                    alt="white-polygon"
                    className="w-[8%] absolute top-0 right-12 lg:top-21 lg:right-[-50px]"
                />
                <img
                    src="/not-start.svg"
                    alt="green-circle"
                    className="absolute w-[8%] bottom-[-40px] left-[-20px] lg:bottom-10 lg:left-[-100px]"
                />
            </div>
        </div >
    )
}

export default SubFooter