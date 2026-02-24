import Head from "next/head"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import AdminLayout from "@/components/layout/AdminLayout"
import Link from "next/link"
import { useRouter } from "next/router"
import { Trash2, Edit } from "lucide-react"

export default function EditCourse() {
  const router = useRouter()
  const { id } = router.query
  const [hasPromoCode, setHasPromoCode] = useState(true)

  // Mock data for initial load based on Figma
  const [courseData, setCourseData] = useState({
    name: "Service Design Essentials",
    price: "3559.00",
    learningTime: "6",
    promoCode: "NEWYEAR200",
    promoAmount: "0",
    discountType: "thb",
    discountValue: "200",
    summary: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    detail: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum aenean fermentum, velit vel, scelerisque morbi accumsan. Nec, tellus leo id leo id felis egestas. Quam sit lorem quis vitae ut mus imperdiet. Volutpat placerat dignissim dolor faucibus elit ornare fringilla. Vivamus amet risus ullamcorper auctor nibh. Maecenas morbi nec vestibulum ac tempus vehicula.\n\nVel, sit magna nisl cras non cursus. Sed sed sit ullamcorper neque. Dictum sapien amet, dictumst maecenas. Mattis nulla tellus ut neque euismod cras amet, volutpat purus. Semper purus viverra turpis in tempus ac nunc. Morbi ullamcorper sed elit enim turpis. Scelerisque rhoncus morbi pulvinar donec at sed fermentum. Duis non urna lacus, sit amet. Accumsan orci elementum nisl tellus sit quis. Integer turpis lectus eu blandit sit. At at cras viverra odio neque nisl consectetur. Arcu senectus aliquet vulputate urna, ornare. Mi sem tellus elementum at commodo blandit nunc. Viverra elit adipiscing ut dui, tellus viverra nec.\n\nLectus pharetra eget curabitur lobortis gravida gravida eget ut. Nullam velit morbi quam a at. Sed eu orci, mollis nulla at sit. Nunc quam integer metus vitae elementum pulvinar mattis nulla molestie. Quis eget vestibulum, faucibus malesuada eu. Et lectus molestie egestas faucibus auctor auctor.",
    lessons: [
      { id: 1, name: "Introduction", subLessons: 10 },
      { id: 2, name: "Service Design Theories and Principles", subLessons: 10 },
      { id: 3, name: "Understanding Users and Finding Opportunities", subLessons: 10 },
      { id: 4, name: "Identifying and Validating Opportunities for Design", subLessons: 10 },
      { id: 5, name: "Prototyping", subLessons: 10 },
      { id: 6, name: "Course Summary", subLessons: 10 },
    ]
  })

  return (
    <AdminLayout>
      <Head>
        <title>Edit Course - Admin Panel</title>
      </Head>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium text-slate-800 flex items-center gap-2">
          <span className="text-slate-400 cursor-pointer hover:text-slate-600" onClick={() => router.push('/admin/courses')}>&larr;</span>
          Course &apos;{courseData.name}&apos;
        </h1>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="border-[#F97316] text-[#F97316] hover:bg-orange-50 hover:text-[#EA580C] h-11 px-8 rounded-md font-medium text-[15px]" 
            onClick={() => router.push('/admin/courses')}
          >
            Cancel
          </Button>
          <Button className="bg-[#2F5FAC] hover:bg-[#254A8A] text-white h-11 px-8 rounded-md font-medium shadow-sm text-[15px]">
            Edit
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-8">
          <div className="col-span-2">
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Course name <span className="text-[#C82A2A]">*</span></Label>
            <Input defaultValue={courseData.name} className="h-12 border-slate-300 text-[15px]" />
          </div>
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Price <span className="text-[#C82A2A]">*</span></Label>
            <Input defaultValue={courseData.price} type="number" className="h-12 border-slate-300 text-[15px]" />
          </div>
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Total learning time <span className="text-[#C82A2A]">*</span></Label>
            <Input defaultValue={courseData.learningTime} type="number" className="h-12 border-slate-300 text-[15px]" />
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
                <Input defaultValue={courseData.promoCode} className="h-12 border-slate-300 bg-white text-[15px]" />
              </div>
              <div>
                <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Minimum purchase amount (THB) <span className="text-[#C82A2A]">*</span></Label>
                <Input defaultValue={courseData.promoAmount} type="number" className="h-12 border-slate-300 bg-white text-[15px]" />
              </div>
              <div className="col-span-2">
                <Label className="mb-4 block text-slate-700 font-medium text-[15px]">Select discount type <span className="text-[#C82A2A]">*</span></Label>
                <RadioGroup defaultValue={courseData.discountType} className="flex flex-col sm:flex-row gap-12">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="thb" id="thb" className="w-5 h-5 border-slate-300 text-[#2F5FAC] data-[state=checked]:border-[#2F5FAC]" />
                    <Label htmlFor="thb" className="text-slate-700 font-medium text-[15px]">Discount (THB)</Label>
                    <Input defaultValue={courseData.discountValue} className="w-32 ml-2 h-12 border-slate-300 bg-white text-[15px]" placeholder="200" />
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
            <Input defaultValue={courseData.summary} className="h-12 border-slate-300 text-[15px]" />
          </div>
          <div>
            <Label className="mb-2 block text-slate-700 font-medium text-[15px]">Course detail <span className="text-[#C82A2A]">*</span></Label>
            <Textarea defaultValue={courseData.detail} className="min-h-[300px] border-slate-300 resize-none text-[14px] leading-relaxed p-4 text-slate-600" />
          </div>
        </div>

        <div className="space-y-8 mt-10">
          <div>
            <Label className="mb-1 block text-slate-700 font-medium text-[15px]">Cover image <span className="text-[#C82A2A]">*</span></Label>
            <p className="text-[13px] text-slate-400 mb-3">Supported file types: .jpg, .png, .jpeg. Max file size: 5 MB</p>
            <div className="w-[240px] h-[240px] relative rounded-xl overflow-hidden bg-[#1E293B] group">
              {/* Mock loaded image */}
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex flex-col justify-between p-2 opacity-80">
                <div className="w-full h-1/2 bg-blue-500/20 rounded-[2px]"></div>
                <div className="flex justify-between h-1/3 mt-2">
                    <div className="w-[45%] h-full bg-green-500/20 rounded-[2px]"></div>
                    <div className="w-[45%] h-full bg-orange-500/20 rounded-[2px]"></div>
                </div>
              </div>
              <div className="absolute top-2 right-2 w-6 h-6 bg-[#A855F7] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-[#9333EA] shadow-sm">
                <span className="text-xs font-bold pb-[1px]">x</span>
              </div>
            </div>
          </div>
          
          <div>
            <Label className="mb-1 block text-slate-700 font-medium text-[15px]">Video Trailer <span className="text-[#C82A2A]">*</span></Label>
            <p className="text-[13px] text-slate-400 mb-3">Supported file types: .mp4, .mov, .avi. Max file size: 20 MB</p>
            <div className="w-[240px] h-[240px] relative rounded-xl overflow-hidden bg-[#1E293B] flex items-center justify-center group">
              {/* Mock loaded video */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex flex-col justify-between p-2 opacity-50">
                <div className="w-full h-1/2 bg-blue-500/20 rounded-[2px]"></div>
                <div className="flex justify-between h-1/3 mt-2">
                    <div className="w-[45%] h-full bg-green-500/20 rounded-[2px]"></div>
                    <div className="w-[45%] h-full bg-orange-500/20 rounded-[2px]"></div>
                </div>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm z-10 cursor-pointer hover:bg-white/30 transition-colors">
                <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-white ml-2"></div>
              </div>
              <div className="absolute top-2 right-2 w-6 h-6 bg-[#A855F7] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-[#9333EA] shadow-sm z-10">
                <span className="text-xs font-bold pb-[1px]">x</span>
              </div>
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
        
        <div className="bg-slate-100 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 bg-[#E2E8F0] p-4 text-slate-500 font-medium text-[15px]">
            <div className="col-span-1 text-center"></div>
            <div className="col-span-6">Lesson name</div>
            <div className="col-span-3">Sub-lesson</div>
            <div className="col-span-2 text-center">Action</div>
          </div>
          
          <div className="bg-white">
            {courseData.lessons.map((lesson) => (
              <div key={lesson.id} className="grid grid-cols-12 p-4 items-center border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <div className="col-span-1 text-center text-slate-400">
                  <div className="grid grid-cols-2 gap-1 w-4 mx-auto cursor-grab">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                  </div>
                </div>
                <div className="col-span-6 flex items-center gap-4">
                  <span className="text-slate-600 font-medium">{lesson.id}</span>
                  <span className="text-slate-800">{lesson.name}</span>
                </div>
                <div className="col-span-3 text-slate-600">
                  {lesson.subLessons}
                </div>
                <div className="col-span-2 flex justify-center gap-3">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-[#8BA4D4] hover:text-red-500 hover:bg-red-50 rounded-full">
                    <Trash2 className="h-[18px] w-[18px]" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-[#8BA4D4] hover:text-[#2F5FAC] hover:bg-blue-50 rounded-full">
                    <Edit className="h-[18px] w-[18px]" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="ghost" className="text-[#2F5FAC] hover:bg-blue-50 hover:text-[#1E3A8A] font-medium">
            Delete Course
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}
