import Button from "@/common/navbar/Button"
import { BadgeCheck } from 'lucide-react';

function RegisterSuccessNoti() {
    return (
        <div className="relative bg-white h-screen px-4 py-10 overflow-hidden">
            <div className="flex flex-col items-center gap-10 max-w-[798px] py-10 mx-auto bg-gray-100 rounded-2xl">
                <BadgeCheck size={100} color="#2FAC8E" strokeWidth={2}/>
                <h3 className="headline3 text-black lg:headline2">Registration success</h3>
                <Button variant="primary" size="lg">Continue</Button>
            </div>
            <div className="absolute left-[-55px] bottom-7 z-0 rotate-340 w-22 h-30 rounded-full bg-orange-100 lg:w-80 lg:h-83 lg:top-[200px] lg:left-[-250px]"></div>
            <div className="absolute left-[-19px] top-[193px] w-8 h-8 rounded-full bg-blue-200 lg:w-19 lg:h-19 lg:top-[81px] lg:left-[87px]"></div>
            <img src="vector_7.svg" alt="blue shape" className="absolute right-0 top-43 lg:hidden" />
            <img src="vector_8.svg" alt="blue shape" className="hidden absolute right-0 top-[-88px] lg:block" />
            <img src="orange_bold_circle.svg" alt="orange circle" className="absolute right-4 top-[400px] w-[10px] h-[9px] lg:hidden" />
            <img src="orange_circle.svg" alt="orange circle" className="hidden absolute right-15 top-[500px] lg:block" />
            <div className="hidden absolute top-[196px] left-[187px] text-[#2FAC61] text-5xl rotate-20 lg:block">+</div>
        </div >
    )
}

export default RegisterSuccessNoti

