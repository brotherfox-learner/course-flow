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
import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { useAuth } from "@/context/AuthContext"
import { format } from "date-fns"

export default function PromoCodeList() {
  const { token, loading, logout } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [promoCodes, setPromoCodes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const fetchPromoCodes = async () => {
      if (!token) return
      setIsLoading(true)
      setErrorMessage("")
      try {
        const res = await axios.get("/api/admin/promocodes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setPromoCodes(res.data.promoCodes || [])
      } catch (error) {
        console.error("Fetch promo codes failed:", error)
        if (error.response?.status === 401 || error.response?.status === 403) {
          await logout()
          return
        }
        setErrorMessage(error.response?.data?.message || "Failed to fetch promo codes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPromoCodes()
  }, [token, logout])

  const formatDate = (date) => {
    if (!date) return "-"
    return format(new Date(date), "dd/MM/yyyy HH:mm")
  }

  const filteredPromoCodes = useMemo(() => {
    return promoCodes.filter((promo) =>
      promo.code?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [promoCodes, searchTerm])

  const formatDiscount = (promo) => {
    if (promo.discount_type === "percent") {
      return `${promo.discount_value}%`
    }
    return `${Number(promo.discount_value).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} THB`
  }

  const formatValidPeriod = (promo) => {
    return `${formatDate(promo.valid_from)} - ${formatDate(promo.valid_until)}`
  }

  const formatUsage = (promo) => {
    if (promo.max_uses == null) {
      return `${promo.used_count}/∞`
    }
    return `${promo.used_count}/${promo.max_uses}`
  }

  const statusBadgeClass = (status) => {
    if (status === "active") return "bg-green-100 text-green-700"
    if (status === "expired") return "bg-red-100 text-red-700"
    return "bg-slate-100 text-slate-700"
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Promo code</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Link href="/admin/promocodes/add">
            <Button className="h-10 bg-blue-600 hover:bg-blue-700">
              + Add Promo Code
            </Button>
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-orange-100/20 border border-orange-500 rounded-lg px-4 py-3 mb-6">
          <p className="text-orange-500 text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader className="bg-slate-100">
            <TableRow>
              <TableHead>Promo code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Valid period</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-slate-500">
                  Loading promo codes...
                </TableCell>
              </TableRow>
            ) : filteredPromoCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-slate-500">
                  No promo codes found
                </TableCell>
              </TableRow>
            ) : (
              filteredPromoCodes.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-medium">{promo.code}</TableCell>
                  <TableCell>{formatDiscount(promo)}</TableCell>
                  <TableCell>{formatValidPeriod(promo)}</TableCell>
                  <TableCell>{formatUsage(promo)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass(promo.status)}`}>
                      {promo.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDate(promo.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" disabled>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Link href={`/admin/promocodes/${promo.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-500">
                          <Edit className="h-4 w-4" />
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
