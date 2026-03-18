import NavBar from "@/shared/components/navbar/NavBar";
import SubFooter from "@/shared/components/SubFooter";
import Footer from "@/shared/components/Footer";
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
