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

const promoCodes = [
  { id: "1", code: "NEWYEAR200", discount: "200 THB", validPeriod: "01/01/2024 - 31/01/2024", usage: "45/100", status: "Active", created: "25/12/2023 10:30AM" },
  { id: "2", code: "SUMMER20", discount: "20%", validPeriod: "01/04/2024 - 30/04/2024", usage: "10/50", status: "Active", created: "20/03/2024 02:15PM" },
  { id: "3", code: "FLASH50", discount: "50%", validPeriod: "15/05/2024 - 16/05/2024", usage: "100/100", status: "Expired", created: "10/05/2024 09:00AM" },
]

export default function PromoCodeList() {
  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Promo code</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search..." 
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
            {promoCodes.map((promo) => (
              <TableRow key={promo.id}>
                <TableCell className="font-medium">{promo.code}</TableCell>
                <TableCell>{promo.discount}</TableCell>
                <TableCell>{promo.validPeriod}</TableCell>
                <TableCell>{promo.usage}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    promo.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {promo.status}
                  </span>
                </TableCell>
                <TableCell className="text-slate-500">{promo.created}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
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
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  )
}
