import Head from "next/head"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import AdminLayout from "@/components/layout/AdminLayout"
import { useEffect, useState } from "react"
import axios from "axios"
import { useAuth } from "@/context/AuthContext"
import { format } from "date-fns"

export default function CourseList() {
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { token, logout } = useAuth()

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get("/api/admin/courses", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setCourses(res.data.courses)
      } catch (error) {
        console.error("Error fetching courses:", error)
        if (error.response?.status === 401 || error.response?.status === 403) {
          logout()
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchCourses()
    }
  }, [token, logout])

  const filteredCourses = courses.filter((course) =>
    course.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    return format(new Date(dateString), "dd/MM/yyyy hh:mm a")
  }

  return (
    <AdminLayout>
      <Head>
        <title>Course - Admin Panel</title>
      </Head>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium text-slate-800">Course</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-slate-300 rounded-md shadow-sm text-[15px]"
            />
          </div>
          <Link href="/admin/courses/add">
            <Button className="h-11 px-6 bg-[#2F5FAC] hover:bg-[#254A8A] text-white rounded-md font-medium shadow-sm text-[15px]">
              + Add Course
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-[#E2E8F0] h-12">
            <TableRow className="hover:bg-[#E2E8F0] border-b-0">
              <TableHead className="w-16 text-center text-slate-600 font-medium"> </TableHead>
              <TableHead className="text-slate-600 font-medium">Image</TableHead>
              <TableHead className="text-slate-600 font-medium">Course name</TableHead>
              <TableHead className="text-slate-600 font-medium">Lesson</TableHead>
              <TableHead className="text-slate-600 font-medium">Price</TableHead>
              <TableHead className="text-slate-600 font-medium">Created date</TableHead>
              <TableHead className="text-slate-600 font-medium">Updated date</TableHead>
              <TableHead className="text-center text-slate-600 font-medium">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32 text-slate-500">
                  Loading courses...
                </TableCell>
              </TableRow>
            ) : filteredCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32 text-slate-500">
                  No courses found
                </TableCell>
              </TableRow>
            ) : (
              filteredCourses.map((course, index) => (
                <TableRow key={course.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors h-20">
                  <TableCell className="text-center font-normal text-slate-600">{index + 1}</TableCell>
                  <TableCell>
                    <div className="w-[100px] h-[70px] bg-slate-200 rounded object-cover overflow-hidden">
                      {course.image ? (
                        <img src={course.image} alt={course.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#1E293B] relative overflow-hidden flex items-center justify-center">
                           <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex flex-col justify-between p-1">
                              <div className="w-full h-1/2 bg-blue-500/20 rounded-[2px]"></div>
                              <div className="flex justify-between h-1/3 mt-1">
                                 <div className="w-[45%] h-full bg-green-500/20 rounded-[2px]"></div>
                                 <div className="w-[45%] h-full bg-orange-500/20 rounded-[2px]"></div>
                              </div>
                           </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-800 text-[15px]">{course.name}</TableCell>
                  <TableCell className="text-slate-600 text-[15px]">{course.lessons || 0} Lessons</TableCell>
                  <TableCell className="text-slate-600 text-[15px]">
                    {Number(course.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-slate-500 text-[14px]">{formatDate(course.created_at)}</TableCell>
                  <TableCell className="text-slate-500 text-[14px]">{formatDate(course.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-4">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-[#8BA4D4] hover:text-red-500 hover:bg-red-50 rounded-full">
                        <Trash2 className="h-[20px] w-[20px]" />
                      </Button>
                      <Link href={`/admin/courses/${course.id}`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-[#8BA4D4] hover:text-[#2F5FAC] hover:bg-blue-50 rounded-full">
                          <Edit className="h-[20px] w-[20px]" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  )
}
