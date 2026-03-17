import NavBar from "@/shared/components/navbar/NavBar";
import SubFooter from "@/shared/components/SubFooter";
import Footer from "@/shared/components/Footer";
import CourseDetail from "@/features/course/components/CourseDetail";

export default function CourseDetailPage() {
  return (
    <div className="pb-[155px] lg:pb-0">
      <NavBar />
      <CourseDetail />
      <SubFooter />
      <Footer />
    </div>
  );
}
