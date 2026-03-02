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

const PAGE_SIZE = 10

export default function AssignmentList() {
  const [assignments, setAssignments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [inputValue, setInputValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteId, setDeleteId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { token, logout } = useAuth()

  const fetchAssignments = async (page = 1, search = "") => {
    setIsLoading(true)
    try {
      const res = await axios.get("/api/admin/assignments", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: PAGE_SIZE, search },
      })
      setAssignments(res.data.assignments)
      setTotal(res.data.total)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error fetching assignments:", error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout()
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchAssignments(1, searchTerm)
    }
  }, [token])

  const handleSearch = () => {
    setSearchTerm(inputValue)
    fetchAssignments(1, inputValue)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch()
  }

  const handlePageChange = (page) => {
    fetchAssignments(page, searchTerm)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await axios.post(
        "/api/admin/assignments/delete",
        { assignment_id: deleteId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setDeleteId(null)
      fetchAssignments(currentPage, searchTerm)
    } catch (error) {
      console.error("Delete assignment error:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    return format(new Date(dateString), "dd/MM/yyyy hh:mma")
  }

  const truncate = (text, len = 22) => {
    if (!text) return "-"
    return text.length > len ? text.slice(0, len) + "..." : text
  }

  return (
    <AdminLayout>
      <Head>
        <title>Assignments - Admin Panel</title>
      </Head>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium text-slate-800">Assignments</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-[320px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 cursor-pointer"
              onClick={handleSearch}
            />
            <Input
              placeholder="Search..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 h-11 border-slate-300 rounded-md shadow-sm text-[15px]"
            />
          </div>
          <Link href="/admin/assignments/add">
            <Button className="h-11 px-6 bg-[#2F5FAC] hover:bg-[#254A8A] text-white rounded-md font-medium shadow-sm text-[15px]">
              + Add Assignment
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-[#E2E8F0] h-12">
            <TableRow className="hover:bg-[#E2E8F0] border-b-0">
              <TableHead className="text-slate-600 font-medium">Assignment detail</TableHead>
              <TableHead className="text-slate-600 font-medium">Course</TableHead>
              <TableHead className="text-slate-600 font-medium">Lesson</TableHead>
              <TableHead className="text-slate-600 font-medium">Sub-lesson</TableHead>
              <TableHead className="text-slate-600 font-medium">Created date</TableHead>
              <TableHead className="text-center text-slate-600 font-medium">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-slate-500">
                  Loading assignments...
                </TableCell>
              </TableRow>
            ) : assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-slate-500">
                  No assignments found
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((a) => (
                <TableRow
                  key={a.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors h-16"
                >
                  <TableCell className="text-slate-700 text-[15px]">
                    {truncate(a.first_question)}
                  </TableCell>
                  <TableCell className="text-slate-600 text-[15px]">
                    {truncate(a.course_name)}
                  </TableCell>
                  <TableCell className="text-slate-600 text-[15px]">
                    {truncate(a.lesson_name)}
                  </TableCell>
                  <TableCell className="text-slate-600 text-[15px]">
                    {truncate(a.sub_lesson_name)}
                  </TableCell>
                  <TableCell className="text-slate-500 text-[14px]">
                    {formatDate(a.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(a.id)}
                        className="h-9 w-9 text-[#8BA4D4] hover:text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="h-[20px] w-[20px]" />
                      </Button>
                      <Link href={`/admin/assignments/${a.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-[#8BA4D4] hover:text-[#2F5FAC] hover:bg-blue-50 rounded-full"
                        >
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

      {!isLoading && total > 0 && (
        <div className="flex justify-center mt-8 mb-15">
          {total > PAGE_SIZE ? (
            <Pagination
              currentPage={currentPage}
              totalItems={total}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          ) : (
            <p className="text-sm text-slate-500">
              Page 1 of 1 ({total} assignment{total !== 1 ? "s" : ""})
            </p>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
