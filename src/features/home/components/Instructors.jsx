function Instrutor() {
    return (
        <div className="relative py-16 bg-white lg:px-[160px] lg:py-[105px]">
            <img src="/orange_polygon.svg" alt="orange-cross" className="absolute top-5 left-[50px] lg:top-auto lg:bottom-20 lg:left-[100px]" />
            <div className="flex flex-col items-center gap-8 lg:gap-15">
                <h3 className="headline3 text-black lg:headline2">Our Professional Instructors</h3>
                <div className="flex flex-col lg:flex-row gap-10 lg:gap-6">
                    <div className="flex flex-col items-center justify-center">
                        <img src="/jane_cooper.svg" alt="jane cooper" className="mb-2 rounded-xl object-cover lg:w-[357px] lg:h-[420px]" />
                        <p className="body1 text-black">Jane Cooper</p>
                        <p className="body2 text-blue-400">UX/UI Designer</p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <img src="/esther_howard.svg" alt="Esther Howard" className="mb-2 rounded-xl object-cover lg:w-[357px] lg:h-[420px]" />
                        <p className="body1 text-black">Esther Howard</p>
                        <p className="body2 text-blue-400">Program Manager</p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <img src="/brooklyn_simmons.svg" alt="Brooklyn Simmons" className="mb-2 rounded-xl object-cover lg:w-[357px] lg:h-[420px]" />
                        <p className="body1 text-black">Brooklyn Simmons</p>
                        <p className="body2 text-blue-400">Software Engineer</p>
                    </div>
                </div>
            </div>
        </div>
    )
}


export default Instrutor