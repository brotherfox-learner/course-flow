import { useState, useEffect, useCallback } from "react"
import { fetchAssignmentList } from "../services/assignment.service"
import { isInProgress } from "../utils/assignmentStatus"

const PAGE_SIZE = 4

const TABS = [
  { key: "all", label: "All" },
  { key: "inprogress", label: "In progress" },
  { key: "submitted", label: "Submitted" },
]

/**
 * Manages assignment list data, tab filtering, and pagination.
 * @param {string|null} token
 */
export function useAssignmentList(token) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  const fetchAssignments = useCallback(async () => {
    if (!token) {
      setLoading(false)
      setAssignments([])
      return
    }
    setLoading(true)
    setError("")
    try {
      const data = await fetchAssignmentList(token)
      setAssignments(data)
    } catch (e) {
      setError(e.message)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const filtered = assignments.filter((a) => {
    if (activeTab === "all") return true
    if (activeTab === "inprogress") return isInProgress(a)
    if (activeTab === "submitted") return !isInProgress(a)
    return true
  })

  const handleTabChange = (key) => {
    setActiveTab(key)
    setCurrentPage(1)
  }

  return {
    assignments,
    filtered,
    loading,
    error,
    activeTab,
    currentPage,
    pageSize: PAGE_SIZE,
    tabs: TABS,
    handleTabChange,
    setCurrentPage,
    refetch: fetchAssignments,
  }
}
