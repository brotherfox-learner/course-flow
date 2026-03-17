import BrandLogo from "./navbar/BrandLogo"
import { useRouter } from "next/router"

function Footer() {
    const router = useRouter()

    return (
        <footer className="bg-blue-700 px-[16px] py-[32px] lg:px-[160px] lg:py-[96px]">
            <div className="flex flex-col gap-8 lg:items-center lg:justify-between lg:flex-row lg:gap-10">
                <BrandLogo />
                <div className="flex flex-col items-start gap-4 lg:flex-row lg:gap-14">
                    <button onClick={() => router.push("/courses")} className="body2 text-gray-500 cursor-pointer">All Courses</button>
                    <button className="body2 text-gray-500 cursor-pointer">Bundle Package</button>
                </div>
                <div className="flex flex-row gap-4">
                    <img src="/fb.svg" alt="facebook" className="cursor-pointer" />
                    <img src="/ig.svg" alt="instagram" className="cursor-pointer" />
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#2f5fac] cursor-pointer">
                        <img
                            src="twitter-x-logo.png"
                            alt="x"
                            className="w-4 h-4 brightness-0 invert"
                        />
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer