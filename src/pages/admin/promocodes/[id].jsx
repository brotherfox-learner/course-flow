import Head from "next/head"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import AdminLayout from "@/components/layout/AdminLayout"
import Link from "next/link"
import { useRouter } from "next/router"

export default function EditPromoCode() {
  const router = useRouter()
  const { id } = router.query

  // Mock data for initial load
  const [promoData, setPromoData] = useState({
    code: "NEWYEAR200",
    minAmount: "0",
    discountType: "thb",
    discountValue: "200"
  })

  return (
    <AdminLayout>
      <Head>
        <title>Edit Promo Code - Admin Panel</title>
      </Head>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium text-slate-800 flex items-center gap-2">
          <span className="text-slate-400 cursor-pointer hover:text-slate-600" onClick={() => router.push('/admin/promocodes')}>&larr;</span>
          Edit Promo Code &apos;{promoData.code}&apos;
        </h1>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="border-[#F97316] text-[#F97316] hover:bg-orange-50 hover:text-[#EA580C] h-11 px-8 rounded-md font-medium text-[15px]" 
            onClick={() => router.push('/admin/promocodes')}
          >
            Cancel
          </Button>
          <Button className="bg-[#2F5FAC] hover:bg-[#254A8A] text-white h-11 px-8 rounded-md font-medium shadow-sm text-[15px]">
            Edit
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Promo code <span className="text-[#C82A2A]">*</span></Label>
            <Input defaultValue={promoData.code} className="h-12 border-slate-300 text-[15px]" />
          </div>
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Minimum purchase amount (THB) <span className="text-[#C82A2A]">*</span></Label>
            <Input defaultValue={promoData.minAmount} type="number" className="h-12 border-slate-300 text-[15px]" />
          </div>
          <div className="col-span-2">
            <Label className="mb-4 block text-slate-700 font-medium text-[15px]">Select discount type <span className="text-[#C82A2A]">*</span></Label>
            <RadioGroup defaultValue={promoData.discountType} className="flex flex-col sm:flex-row gap-12">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="thb" id="thb" className="w-5 h-5 border-slate-300 text-[#2F5FAC] data-[state=checked]:border-[#2F5FAC]" />
                <Label htmlFor="thb" className="text-slate-700 font-medium text-[15px]">Discount (THB)</Label>
                <Input defaultValue={promoData.discountValue} className="w-32 ml-2 h-12 border-slate-300 bg-white text-[15px]" placeholder="200" />
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="percent" id="percent" className="w-5 h-5 border-slate-300 text-[#2F5FAC] data-[state=checked]:border-[#2F5FAC]" />
                <Label htmlFor="percent" className="text-slate-700 font-medium text-[15px]">Discount (%)</Label>
                <Input className="w-32 ml-2 h-12 border-slate-300 bg-white text-[15px]" placeholder="Place Holder" />
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
          <Button variant="ghost" className="text-[#2F5FAC] hover:bg-blue-50 hover:text-[#1E3A8A] font-medium">
            Delete Promo Code
          </Button>
      </div>
    </AdminLayout>
  )
}
