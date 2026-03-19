import Button from "@/shared/components/navbar/Button"
import { useRouter } from "next/router"

function HeroSection() {
    const router = useRouter()
    return (
        <div className="relative z-10 bg-blue-100 pt-14 px-4 min-h-[calc(100vh-var(--navbar-mobile-height))] lg:min-h-[calc(100vh-var(--navbar-height))] lg:px-[160px] lg:flex lg:flex-row lg:pt-0 overflow-hidden">
            <div className="space-y-4 lg:space-y-6 relative z-10 lg:self-center lg:w-[643px]">
                <h2 className="headline2 text-black lg:headline1">Best Virtual <br /> Classroom Software</h2>
                <p className="body2 text-gray-700 lg:body1">Welcome to Schooler! The one-stop online class management system that caters to all your educational needs!</p>
                <Button onClick={() => router.push("/courses")} variant="primary" size="lg" className="mt-4 lg:mt-15">Explore Courses</Button>
            </div>
            <img src="/computer_book.svg" alt="computer on book" className="z-5 absolute w-[317px] bottom-[38px] right-7 lg:w-[500px] lg:top-38 lg:right-40" />
            <img src="/green_cross.svg" alt="green-cross" className="z-5 absolute bottom-[340px] right-[133px] lg:top-35 lg:right-[600px]" />
            <img src="/green_bold_circle.svg" alt="blue-shape" className="z-5 absolute bottom-[206px] right-[27px] lg:bottom-[272px] lg:right-13" />
            <img src="/orange_polygon.svg" alt="orange-cross" className="z-5 absolute bottom-[-10px] right-33 lg:bottom-[76px] lg:right-[167px]" />
            <img src="/blue_gradient_circle.svg" alt="blue-gradient-circle" className="z-5 absolute bottom-38 right-[324px] lg:bottom-[150px] lg:right-[1027px]" />

            <img src="/vector_mobile.svg" alt="blue-shape-moile" className="absolute z-0 bottom-0 right-0 w-full h-auto md:hidden" />
            <img src="/vector_desktop.svg" alt="blue-shape" className="absolute z-0 top-0 bottom-0 right-0 h-full w-auto object-contain hidden md:block" />
            <img src="/ellipse.svg" alt="blue-shape" className="w-[104px] h-[104px] absolute z-0 top-15 left-[-55px]" />
        </div>
    )
}

export default HeroSection