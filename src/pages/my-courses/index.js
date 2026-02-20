import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Card from "@/common/card";
import NavBar from "@/common/navbar/NavBar";
import Footer from "@/common/Footer";

// Hardcoded user ID — จะเปลี่ยนเป็น auth ทีหลัง
const TEMP_USER_ID = "353c3e0e-28c4-4773-a818-ec4833ac6c4a";

export default function MyCourses() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ inprogress: 0, completed: 0, total: 0 });
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const res = await fetch(`/api/my-courses?userId=${TEMP_USER_ID}`);
        const text = await res.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          setError("Server returned invalid response. Please try again.");
          return;
        }

        if (res.ok) {
          setUser(data.user);
          setCourses(data.courses ?? []);
          setStats(data.stats ?? { inprogress: 0, completed: 0, total: 0 });
        } else {
          setError(data.error || "Failed to load courses");
        }
      } catch (err) {
        console.error("Failed to fetch my courses:", err);
        setError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCourses = courses.filter((course) => {
    if (activeTab === "all") return true;
    if (activeTab === "inprogress") return course.enrollmentStatus === "active";
    if (activeTab === "completed")
      return course.enrollmentStatus === "completed";
    return true;
  });

  const tabs = [
    { key: "all", label: "All Courses" },
    { key: "inprogress", label: "Inprogress" },
    { key: "completed", label: "Completed" },
  ];

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <p className="body2 text-gray-500">Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      {/* desktop */}
      <main className="min-h-screen bg-white relative">
        <div className="hidden lg:block">
          <div className="absolute top-[80px] left-[40px] w-[10px] h-[10px] bg-blue-300 rounded-full opacity-60"></div>
          <div className="absolute top-[110px] left-[20px] w-[25px] h-[25px] bg-blue-200 rounded-full opacity-40"></div>
          <div className="absolute top-[140px] left-[120px] text-green-400 text-xl opacity-60">✦</div>
          <div className="absolute top-[100px] right-[80px] text-orange-300 text-lg opacity-60">▽</div>
          <div className="absolute top-[110px] right-[10px] w-[30px] h-[30px] bg-blue-200 rounded-full opacity-30"></div>
        </div>
        {/* mobile */}
        <div className="lg:hidden absolute top-[30px] left-[20px] w-[8px] h-[8px] bg-blue-300 rounded-full opacity-60"></div>

        <div className="max-w-[1440px] mx-auto px-4 lg:px-[160px] pt-12 lg:pt-16 pb-6">
          <h1 className="headline2 text-black text-center mb-8">My Courses</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="body2 text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-6 lg:gap-8 border-b border-gray-300 justify-center lg:justify-start">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 body2 font-medium transition-colors cursor-pointer relative ${
                  activeTab === tab.key
                    ? "text-black border-b-2 border-black"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 lg:px-[160px] pb-16 lg:pb-24">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 lg:items-start">
            <aside className="hidden lg:flex flex-col items-center w-[340px] h-[380px] shrink-0 sticky top-24 bg-white rounded-lg shadow-1 p-6">
              <div className="w-[120px] h-[120px] rounded-full overflow-hidden mb-4 border-2 border-gray-200">
                <img
                  src={user?.avatarUrl || "/default_avatar.png"}
                  alt={user?.name || "User avatar"}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="headline3 text-black mb-6">{user?.name || "User"}</h3>
              <div className="flex justify-between gap-4 w-full">
                <div className="flex-1  bg-gray-100 rounded-lg py-6 px-4">
                  <p className="body2 text-gray-700 mb-3">Course<br />Inprogress</p>
                  <p className="headline3 text-black">{stats.inprogress}</p>
                </div>
                <div className="flex-1 bg-gray-100 rounded-lg py-6 px-4 ">
                  <p className="body2 text-gray-700 mb-3">Course<br />Complete</p>
                  <p className="headline3 text-black">{stats.completed}</p>
                </div>
              </div>
            </aside>


            <div className="flex-1">
              {filteredCourses.length === 0 ? (
                <div className="text-center py-16">
                  <p className="body2 text-gray-500">
                    {activeTab === "all"
                      ? "You haven't enrolled in any course yet."
                      : activeTab === "inprogress"
                        ? "No courses in progress."
                        : "No completed courses yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {filteredCourses.map((course) => (
                    <Card
                      key={course.enrollmentId}
                      category="Course"
                      courseName={course.courseName}
                      description={course.courseSummary}
                      lessonCount={course.lessonCount}
                      durationHours={course.totalLearningTime}
                      imageUrl={course.coverImgUrl}
                      badge={course.enrollmentStatus === "completed" ? "completed" : "inprogress"}
                      onClick={() => router.push(`/courses/${course.courseId}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* mobile nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-50 px-4 py-3">
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
            <div className="w-[40px] h-[40px] rounded-full overflow-hidden border border-gray-200 shrink-0">
              <img
                src={user?.avatarUrl || "/default_avatar.png"}
                alt={user?.name || "User avatar"}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="body2 font-medium text-black flex-1 truncate">
              {user?.name || "User"}
            </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1.5">
                <span className="body4 text-gray-600">Course Inprogress</span>
                <span className="body3 font-semibold text-black">{stats.inprogress}</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1.5">
                <span className="body4 text-gray-600">Course Complete</span>
                <span className="body3 font-semibold text-black">{stats.completed}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden h-[72px]"></div>
      </main>

      <Footer />
    </>
  );
}
