import Head from "next/head"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import AdminLayout from "@/components/layout/AdminLayout"
import Link from "next/link"
import { useRouter } from "next/router"

export default function AddCourse() {
  const router = useRouter()
  const [hasPromoCode, setHasPromoCode] = useState(true)

  return (
    <AdminLayout>
      <Head>
        <title>Add Course - Admin Panel</title>
      </Head>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium text-slate-800">Add Course</h1>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="border-[#F97316] text-[#F97316] hover:bg-orange-50 hover:text-[#EA580C] h-11 px-8 rounded-md font-medium text-[15px]" 
            onClick={() => router.push('/admin/courses')}
          >
            Cancel
          </Button>
          <Button className="bg-[#2F5FAC] hover:bg-[#254A8A] text-white h-11 px-8 rounded-md font-medium shadow-sm text-[15px]">
            Create
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-8">
          <div className="col-span-2">
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Course name <span className="text-[#C82A2A]">*</span></Label>
            <Input placeholder="Place Holder" className="h-12 border-slate-300 text-[15px]" />
          </div>
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Price <span className="text-[#C82A2A]">*</span></Label>
            <Input placeholder="Place Holder" type="number" className="h-12 border-slate-300 text-[15px]" />
          </div>
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Total learning time <span className="text-[#C82A2A]">*</span></Label>
            <Input placeholder="Place Holder" type="number" className="h-12 border-slate-300 text-[15px]" />
          </div>
        </div>

        <div className="mb-10 p-8 bg-[#F6F8FE] rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <input 
              type="checkbox" 
              id="promo" 
              className="w-5 h-5 text-[#2F5FAC] rounded border-slate-300 focus:ring-[#2F5FAC]"
              checked={hasPromoCode}
              onChange={(e) => setHasPromoCode(e.target.checked)}
            />
            <Label htmlFor="promo" className="font-medium text-slate-800 text-[16px]">Promo code</Label>
          </div>
          
          {hasPromoCode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div>
                <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Set promo code <span className="text-[#C82A2A]">*</span></Label>
                <Input placeholder="NEWYEAR200" className="h-12 border-slate-300 bg-white text-[15px]" />
              </div>
              <div>
                <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Minimum purchase amount (THB) <span className="text-[#C82A2A]">*</span></Label>
                <Input placeholder="0" type="number" className="h-12 border-slate-300 bg-white text-[15px]" />
              </div>
              <div className="col-span-2">
                <Label className="mb-4 block text-slate-700 font-medium text-[15px]">Select discount type <span className="text-[#C82A2A]">*</span></Label>
                <RadioGroup defaultValue="thb" className="flex flex-col sm:flex-row gap-12">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="thb" id="thb" className="w-5 h-5 border-slate-300 text-[#2F5FAC] data-[state=checked]:border-[#2F5FAC]" />
                    <Label htmlFor="thb" className="text-slate-700 font-medium text-[15px]">Discount (THB)</Label>
                    <Input className="w-32 ml-2 h-12 border-slate-300 bg-white text-[15px]" placeholder="200" />
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="percent" id="percent" className="w-5 h-5 border-slate-300 text-[#2F5FAC] data-[state=checked]:border-[#2F5FAC]" />
                    <Label htmlFor="percent" className="text-slate-700 font-medium text-[15px]">Discount (%)</Label>
                    <Input className="w-32 ml-2 h-12 border-slate-300 bg-white text-[15px]" placeholder="Place Holder" />
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Course summary <span className="text-[#C82A2A]">*</span></Label>
            <Input placeholder="Place Holder" className="h-12 border-slate-300 text-[15px]" />
          </div>
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Course detail <span className="text-[#C82A2A]">*</span></Label>
            <Textarea placeholder="Place Holder" className="min-h-[200px] border-slate-300 resize-none text-[15px] p-4" />
          </div>
        </div>

        <div className="space-y-8 mt-10">
          <div>
            <Label className="mb-1 block text-slate-700 font-medium text-[15px]">Cover image <span className="text-[#C82A2A]">*</span></Label>
            <p className="text-[13px] text-slate-400 mb-3">Supported file types: .jpg, .png, .jpeg. Max file size: 5 MB</p>
            <div className="w-[240px] h-[240px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-[#2F5FAC] bg-[#F8FAFC] cursor-pointer hover:bg-blue-50 hover:border-[#8BA4D4] transition-colors">
              <span className="text-4xl font-light mb-2">+</span>
              <span className="text-[15px] font-medium">Upload Image</span>
            </div>
          </div>
          
          <div>
            <Label className="mb-1 block text-slate-700 font-medium text-[15px]">Video Trailer <span className="text-[#C82A2A]">*</span></Label>
            <p className="text-[13px] text-slate-400 mb-3">Supported file types: .mp4, .mov, .avi. Max file size: 20 MB</p>
            <div className="w-[240px] h-[240px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-[#2F5FAC] bg-[#F8FAFC] cursor-pointer hover:bg-blue-50 hover:border-[#8BA4D4] transition-colors">
              <span className="text-4xl font-light mb-2">+</span>
              <span className="text-[15px] font-medium">Upload Video</span>
            </div>
          </div>

          <div>
            <Label className="mb-1 block text-slate-700 font-medium text-[15px]">Attach File (Optional)</Label>
            <div className="w-[140px] h-[140px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-[#2F5FAC] bg-[#F8FAFC] cursor-pointer hover:bg-blue-50 hover:border-[#8BA4D4] transition-colors">
              <span className="text-3xl font-light mb-2">+</span>
              <span className="text-[14px] font-medium">Upload File</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[22px] font-medium text-slate-800">Lesson</h2>
          <Button className="bg-[#2F5FAC] hover:bg-[#254A8A] text-white h-12 px-6 rounded-md font-medium shadow-sm text-[15px]">
            + Add Lesson
          </Button>
        </div>
        
        <div className="bg-[#E2E8F0] bg-opacity-30 border border-slate-100 rounded-xl p-20 flex flex-col items-center justify-center text-center text-[#64748B]">
          <p className="text-[16px] leading-relaxed">
            เมื่อสร้าง course แล้ว<br />เลื่อนลงมาด้านล่างจะมี lesson ให้สร้างบทเรียนเพิ่มได้<br />
            (ใน 1 คอร์สต้องมีอย่างน้อย 1 บทเรียน)
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
