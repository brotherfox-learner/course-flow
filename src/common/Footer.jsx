import BrandLogo from "./navbar/BrandLogo"

function Footer() {
    return (
        <footer className="bg-blue-700 px-[16px] py-[32px] lg:px-[160px] lg:py-[96px]">
            <div className="flex flex-col gap-8 lg:items-center lg:justify-between lg:flex-row lg:gap-10">
                <BrandLogo />
                <div className="flex flex-col items-start gap-4 lg:flex-row lg:gap-14">
                    <button className="text-base font-normal">All Courses</button>
                    <button className="text-base font-normal">Bundle Package</button>
                </div>
                <div className="flex flex-row gap-4">
                    <img src="/fb.svg" alt="facebook" />
                    <img src="/ig.svg" alt="instagram" />
                    <img src="/tw.svg" alt="twitter" />
                </div>
            </div>
        </footer>
    )
}

export default Footer