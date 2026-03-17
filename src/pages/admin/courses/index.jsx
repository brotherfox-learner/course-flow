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
import Modal from "@/common/modal"
import { Search, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import AdminLayout from "@/components/layout/AdminLayout"
import { useEffect, useState } from "react"
import axios from "axios"
import { useAuth } from "@/context/AuthContext"
import { format } from "date-fns"
import Pagination from "@/common/pagination"

export default function CourseList() {
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const { token, logout } = useAuth()

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get("/api/admin/courses", {
          params: {
            page: currentPage,
            limit: pageSize,
            search: searchTerm
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setCourses(res.data.courses)
        setTotalItems(res.data.total || 0)
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
  }, [token, currentPage, pageSize, searchTerm, logout])

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    return format(new Date(dateString), "dd/MM/yyyy hh:mm a")
  }

  const handleDeleteClick = (course) => {
    setCourseToDelete(course)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return

    setIsDeleting(true)
    try {
      await axios.delete("/api/admin/courses/delete", {
        data: { course_id: courseToDelete.id },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Remove course from local state
      setCourses(prev => prev.filter(course => course.id !== courseToDelete.id))
      setDeleteDialogOpen(false)
      setCourseToDelete(null)
    } catch (error) {
      console.error("Delete course error:", error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout()
      }
      // You could add toast notification here
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setCourseToDelete(null)
  }

  return (
    <AdminLayout>
      <Head>
        <title>Course - Admin Panel</title>
      </Head>
      <div className="flex justify-between items-center mb-8 p-8 bg-white h-[92px] border-b border-slate-200 shrink-0">
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
            <Button variant="primary" size="admin">
              + Add Course
            </Button>
          </Link>
        </div>
      </div>

      <div className="m-8 mb-16">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-300 h-[41px]">
            <TableRow className="hover:bg-gray-300 border-b-0">
              <TableHead className="w-[48px] text-center body3 text-gray-800 font-normal"> </TableHead>
              <TableHead className="w-[96px]  body3 text-gray-800 font-normal">Image</TableHead>
              <TableHead className="body3 text-gray-800 font-normal">Course name</TableHead>
              <TableHead className="body3 text-gray-800 font-normal">Lesson</TableHead>
              <TableHead className="body3 text-gray-800 font-normal">Price</TableHead>
              <TableHead className="body3 text-gray-800 font-normal">Created date</TableHead>
              <TableHead className="body3 text-gray-800 font-normal">Updated date</TableHead>
              <TableHead className="text-center body3 text-gray-800 font-normal">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32 text-slate-500">
                  Loading courses...
                </TableCell>
              </TableRow>
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32 text-slate-500">
                  No courses found
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course, index) => (
                <TableRow key={course.id} className="border-b border-[#F1F2F6] hover:bg-gray-100 transition-colors h-[88px]">
                  <TableCell className="text-center body2 font-normal text-black">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                  <TableCell>
                    <div className="w-16 h-[47px] bg-gray-200 rounded object-cover overflow-hidden">
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
                  <TableCell className="body2 font-normal text-black">
                    <a
                      href={`/courses/${course.slug || course.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-500 hover:underline cursor-pointer"
                    >
                      {course.name}
                    </a>
                  </TableCell>
                  <TableCell className="body2 font-normal text-black">{course.lessons || 0} Lessons</TableCell>
                  <TableCell className="body2 font-normal text-black">
                    {Number(course.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="body2 font-normal text-black">{formatDate(course.created_at)}</TableCell>
                  <TableCell className="body2 font-normal text-black">{formatDate(course.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-4">
                      <Button 
                        variant="ghost" 
                        size="icon-xs" 
                        className="h-9 w-9 text-blue-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                        onClick={() => handleDeleteClick(course)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                      <Link href={`/admin/courses/${course.id}`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-300 hover:text-blue-500 hover:bg-blue-50 rounded-full">
                          <Edit className="size-5" />
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

      {/* Pagination */}
      {!isLoading && courses.length > 0 && (
        <div className="mt-6 flex justify-center cursor-pointer">
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
      </div>

      <Modal
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        title="Delete Course"
        message={`Are you sure you want to delete "${courseToDelete?.name || ""}"? This action cannot be undone and will permanently remove the course and all its lessons.`}
        secondaryLabel="Cancel"
        onSecondaryClick={handleDeleteCancel}
        primaryLabel={isDeleting ? "Deleting..." : "Delete Course"}
        onPrimaryClick={handleDeleteConfirm}
      />
    </AdminLayout>
  )
}
