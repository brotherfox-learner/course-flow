import NavBar from "@/common/navbar/NavBar";
import SubFooter from "@/common/SubFooter";
import Footer from "@/common/Footer";
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
