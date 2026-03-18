import { useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import NavBar from "@/shared/components/navbar/NavBar"
import Footer from "@/shared/components/Footer"
import { useAuth } from "@/features/auth/context/AuthContext"
import { AssignmentsList } from "@/features/assignments"
import { useAssignmentList } from "@/features/assignments/hooks/useAssignmentList"

export default function AssignmentsPage() {
  const router = useRouter()
  const { token, loading: authLoading, isLoggedIn } = useAuth()

  const {
    filtered,
    loading,
    error,
    activeTab,
    tabs,
    currentPage,
    handleTabChange,
    setCurrentPage,
    refetch,
  } = useAssignmentList(token)

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.replace("/login")
  }, [authLoading, isLoggedIn, router])

  if (authLoading) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen bg-white" />
        <Footer />
      </>
    )
  }

  return (
    <div className="overflow-x-hidden">
      <Head>
        <title>My Assignments - CourseFlow</title>
      </Head>
      <NavBar />
      <main className="min-h-screen bg-[#F6F7FC] relative">
        <div aria-hidden="true">
          <img src="/ellipse.svg" className="absolute w-9 h-9 right-[-12px] top-[161px] lg:w-[74px] lg:h-[74px] lg:top-[205px] lg:right-[-21px]" alt="" />
          <img src="/green_cross.svg" className="absolute w-[15.56px] h-[15.56px] left-[71px] top-[177px] lg:w-[18px] lg:h-[18px] lg:top-[205px] lg:left-[250px] hidden lg:block" alt="" />
          <div className="absolute w-[8.56px] h-[8.56px] left-[36px] top-[40px] rounded-full border-[3px] lg:w-[10px] lg:h-[10px] lg:left-[75px] lg:top-[50px] border-[#2F5FAC] box-sizing-border" />
          <img src="/orange_polygon.svg" className="absolute w-[27.75px] h-[27.75px] right-[45px] top-[60px] lg:w-[35px] lg:h-[35px] lg:right-[106px] lg:top-[125px]" alt="" />
          <img src="/ellipse.svg" className="absolute w-[20.25px] h-[20.25px] left-[-10px] top-[85.92px] lg:w-[25px] lg:h-[25px] lg:left-[32px] lg:top-[107px]" alt="" />
        </div>

        <div className="max-w-[1440px] mx-auto px-4 lg:px-[160px] pt-12 lg:pt-16 pb-24">
          <h1 className="text-[24px] lg:headline2 text-black text-center mb-8">My Assignments</h1>

          <AssignmentsList
            filtered={filtered}
            loading={loading}
            error={error}
            activeTab={activeTab}
            tabs={tabs}
            currentPage={currentPage}
            token={token}
            onTabChange={handleTabChange}
            onPageChange={setCurrentPage}
            onRefresh={refetch}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
