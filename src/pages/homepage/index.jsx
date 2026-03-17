import NavBar from "@/shared/components/navbar/NavBar";
import FeatureSection from "@/features/home/components/FeatureSection";
import HeroSection from "@/features/home/components/HeroSection";
import Instrutor from "@/features/home/components/Instructors";
import OurGraduates from "@/features/home/components/OurGraduates";
import SubFooter from "@/shared/components/SubFooter";
import Footer from "@/shared/components/Footer";

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