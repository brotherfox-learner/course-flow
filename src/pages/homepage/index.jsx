import NavBar from "@/common/navbar/NavBar";
import FeatureSection from "@/features/home/components/FeatureSection";
import HeroSection from "@/features/home/components/HeroSection";
import Instrutor from "@/features/home/components/Instructors";
import OurGraduates from "@/features/home/components/OurGraduates";
import SubFooter from "@/common/SubFooter";
import Footer from "@/common/Footer";

function Homepage() {
    return (
        <>
            <NavBar />
            <HeroSection />
            <FeatureSection/>
            <Instrutor/>
            <OurGraduates/>
            <SubFooter/>
            <Footer/>
        </>
    )
}

export default Homepage;