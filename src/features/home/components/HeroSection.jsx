import Button from "@/common/navbar/Button"
import router from "next/router"

function HeroSection () {
    return(
        <div className="relative z-10 bg-blue-100 pt-14 px-4 min-h-screen lg:px-[160px] lg:flex lg:flex-row lg:justify-between lg:pt-0">
            <div className="space-y-4 lg:space-y-6 relative z-10 lg:self-center lg:w-[643px]">
                <h2 className="headline2 text-black lg:headline1">Best Virtual <br /> Classroom Software</h2>
                <p className="body2 text-gray-700 lg:body1">Welcome to Schooler! The one-stop online class management system that caters to all your educational needs!</p>
                <Button onClick={() => router.push("/courses")} variant="primary" size="lg" className="mt-4 lg:mt-15">Explore Courses</Button>
            </div>
            <div className="relative z-10 mt-[20px] flex items-center">
                <img src="/computer_book.svg" alt="computer on book" className="w-[452px]"/>
                <img src="/green_cross.svg" alt="green-cross" className="absolute top-0 right-30 lg:top-21 lg:left-0"/>
                <img src="/green_bold_circle.svg" alt="blue-shape" className="absolute top-35 right-0 lg:top-auto lg:right-[-100px]"/>
                <img src="/orange_polygon.svg" alt="orange-cross" className="absolute bottom-[-10px] right-33 lg:right-2 lg:bottom-20"/>
                <img src="/blue_gradient_circle.svg" alt="blue-gradient-circle" className="absolute z-0 bottom-34 left-0 lg:top-auto lg:bottom-31 lg:left-[-250px]"/>
            </div>
            <img src="/vector_mobile.svg" alt="blue-shape" className="absolute z-0 bottom-0 right-0 md:hidden"/>
            <img src="/vector_desktop.svg" alt="blue-shape" className="absolute z-0 bottom-0 right-0 hidden md:flex"/>
            <img src="/ellipse.svg" alt="blue-shape" className="w-[104px] h-[104px] absolute z-0 top-15 left-[-55px]"/>
        </div>
    )
}

export default HeroSection