import Button from "@/common/navbar/Button"

function HeroSection () {
    return(
        <div className="relative bg-blue-100 pt-14 px-4 h-[5000px]">
            <div className="space-y-4">
                <h2 className="headline2 text-black">Best Virtual Classroom Software</h2>
                <p className="body2 text-gray-700">Welcome to Schooler! The one-stop online class management system that caters to all your educational needs! </p>
                <Button variant="primary" size="lg" className="mt-4">Explore Courses</Button>
            </div>
            <div>
                <img src="/computer_book.svg" alt="computer on book" />
            </div>
            <img src="vector_mobile.svg" alt="blue-shape" className="absolute bottom-0 right-0"/>
        </div>
    )
}

export default HeroSection