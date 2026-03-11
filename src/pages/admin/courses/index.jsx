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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
      await axios.delete(`/api/admin/courses/${courseToDelete.id}`, {
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
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32 text-slate-500">
                  No courses found
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course, index) => (
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
                  <TableCell className="font-medium text-slate-800 text-[15px]">
                    <a
                      href={`/courses/${course.slug || course.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#2F5FAC] hover:underline cursor-pointer"
                    >
                      {course.name}
                    </a>
                  </TableCell>
                  <TableCell className="text-slate-600 text-[15px]">{course.lessons || 0} Lessons</TableCell>
                  <TableCell className="text-slate-600 text-[15px]">
                    {Number(course.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-slate-500 text-[14px]">{formatDate(course.created_at)}</TableCell>
                  <TableCell className="text-slate-500 text-[14px]">{formatDate(course.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-[#8BA4D4] hover:text-red-500 hover:bg-red-50 rounded-full"
                        onClick={() => handleDeleteClick(course)}
                        disabled={isDeleting}
                      >
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

      {/* Pagination */}
      {!isLoading && courses.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{courseToDelete?.name}"? This action cannot be undone and will permanently remove the course and all its lessons.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
