import NavBar from "@/common/navbar/NavBar";
import SubFooter from "@/common/SubFooter";
import Footer from "@/common/Footer";
import CourseCard from "@/features/course/components/CourseCard.jsx";

export default function CoursesPage() {
  return (
    <>
      <NavBar />  
      <CourseCard />
      <SubFooter />
      <Footer />
    </>
  );
}
