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
import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { useAuth } from "@/context/AuthContext"
import { format } from "date-fns"
import Pagination from "@/common/pagination"

const PAGE_SIZE = 10

export default function AssignmentList() {
  const [assignments, setAssignments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
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

  const hasFetchedInitial = useRef(false)

  useEffect(() => {
    if (!token) return
    if (!hasFetchedInitial.current) {
      hasFetchedInitial.current = true
      fetchAssignments(1, searchTerm)
    } else {
      const timer = setTimeout(() => fetchAssignments(1, searchTerm), 400)
      return () => clearTimeout(timer)
    }
  }, [token, searchTerm])

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
      <div className="flex justify-between items-center mb-8 p-8 bg-white h-[92px] border-b border-slate-200">
        <h1 className="text-2xl font-medium text-slate-800">Assignments</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-slate-300 rounded-md shadow-sm text-[15px]"
            />
          </div>
          <Link href="/admin/assignments/add">
            <Button variant="primary" size="admin">
              + Add Assignment
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
              <TableHead className="body3 text-gray-800 font-normal">Assignment detail</TableHead>
              <TableHead className="body3 text-gray-800 font-normal">Course</TableHead>
              <TableHead className="body3 text-gray-800 font-normal">Lesson</TableHead>
              <TableHead className="body3 text-gray-800 font-normal">Sub-lesson</TableHead>
              <TableHead className="body3 text-gray-800 font-normal">Created date</TableHead>
              <TableHead className="text-center body3 text-gray-800 font-normal">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-slate-500">
                  Loading assignments...
                </TableCell>
              </TableRow>
            ) : assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-slate-500">
                  No assignments found
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((a, index) => (
                <TableRow
                  key={a.id}
                  className="border-b border-[#F1F2F6] hover:bg-gray-100 transition-colors h-[88px]"
                >
                  <TableCell className="text-center body2 font-normal text-black">{(currentPage - 1) * PAGE_SIZE + index + 1}</TableCell>
                  <TableCell className="body2 font-normal text-black">
                    {truncate(a.first_question)}
                  </TableCell>
                  <TableCell className="body2 font-normal text-black">
                    {truncate(a.course_name)}
                  </TableCell>
                  <TableCell className="body2 font-normal text-black">
                    {truncate(a.lesson_name)}
                  </TableCell>
                  <TableCell className="body2 font-normal text-black">
                    {truncate(a.sub_lesson_name)}
                  </TableCell>
                  <TableCell className="body2 font-normal text-black">
                    {formatDate(a.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setDeleteId(a.id)}
                        className="h-9 w-9 text-blue-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                        disabled={isDeleting}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                      <Link href={`/admin/assignments/${a.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-blue-300 hover:text-blue-500 hover:bg-blue-50 rounded-full"
                        >
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

      {!isLoading && total > 0 && (
        <div className="mt-6 flex justify-center cursor-pointer">
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
      </div>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? This action cannot be undone."
        secondaryLabel="Cancel"
        onSecondaryClick={() => setDeleteId(null)}
        primaryLabel={isDeleting ? "Deleting..." : "Delete"}
        onPrimaryClick={handleDelete}
      />
    </AdminLayout>
  )
}
