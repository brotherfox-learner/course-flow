import NavBar from "@/common/navbar/NavBar";
import SubFooter from "@/common/SubFooter";
import Footer from "@/common/Footer";
import Link from "next/link"

export default function Home() {
  return (
    <>
      <NavBar/>
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <Link  href="/common-test" className="bg-blue-500 text-white px-4 py-2 rounded-md" >Go to Common Test</Link>
      </div>        
      <SubFooter />
      <Footer />
    </>
  );
}