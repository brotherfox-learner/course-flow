import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import AdminLayout from "@/components/layout/AdminLayout"
import Link from "next/link"
import { useRouter } from "next/router"

export default function AddPromoCode() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    code: "",
    discountType: "thb",
    discountAmount: "",
    discountPercent: "",
    minPurchase: "",
    validFrom: "",
    validTo: "",
    usageLimit: "",
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }))
  }

  const handleRadioChange = (value) => {
    setFormData(prev => ({ ...prev, discountType: value }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.code) newErrors.code = "Promo code is required"
    if (!formData.minPurchase) newErrors.minPurchase = "Minimum purchase is required"
    
    if (formData.discountType === "thb" && !formData.discountAmount) {
      newErrors.discountAmount = "Discount amount is required"
    }
    if (formData.discountType === "percent" && !formData.discountPercent) {
      newErrors.discountPercent = "Discount percentage is required"
    }

    if (!formData.validFrom) newErrors.validFrom = "Start date is required"
    if (!formData.validTo) newErrors.validTo = "End date is required"
    if (!formData.usageLimit) newErrors.usageLimit = "Usage limit is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      // TODO: Save to Supabase
      console.log("Saving promo code:", formData)
      router.push('/admin/promocodes')
    }
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Add Promo Code</h1>
        <div className="flex gap-4">
          <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50" onClick={() => router.push('/admin/promocodes')}>
            Cancel
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>
            Create
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-8 max-w-4xl">
        <h2 className="text-xl font-semibold mb-6">Promo Code Information</h2>
        
        <form className="space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-2 block">Promo code *</Label>
              <Input 
                name="code"
                placeholder="NEWYEAR200" 
                value={formData.code}
                onChange={handleChange}
                className={errors.code ? "border-red-500" : ""}
              />
              {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Minimum purchase amount (THB) *</Label>
              <Input 
                name="minPurchase"
                type="number"
                placeholder="1000" 
                value={formData.minPurchase}
                onChange={handleChange}
                className={errors.minPurchase ? "border-red-500" : ""}
              />
              {errors.minPurchase && <p className="text-red-500 text-sm mt-1">{errors.minPurchase}</p>}
            </div>
          </div>

          {/* Row 2: Discount Type */}
          <div>
            <Label className="mb-4 block">Select discount type *</Label>
            <RadioGroup value={formData.discountType} onValueChange={handleRadioChange} className="flex gap-8">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="thb" id="thb" />
                <Label htmlFor="thb">Discount (THB)</Label>
                <div className="ml-2">
                  <Input 
                    name="discountAmount"
                    type="number"
                    className={`w-32 ${errors.discountAmount && formData.discountType === 'thb' ? "border-red-500" : ""}`}
                    placeholder="200" 
                    value={formData.discountAmount}
                    onChange={handleChange}
                    disabled={formData.discountType !== 'thb'}
                  />
                  {errors.discountAmount && formData.discountType === 'thb' && 
                    <p className="text-red-500 text-sm mt-1">{errors.discountAmount}</p>}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <RadioGroupItem value="percent" id="percent" />
                <Label htmlFor="percent">Discount (%)</Label>
                <div className="ml-2">
                  <Input 
                    name="discountPercent"
                    type="number"
                    className={`w-32 ${errors.discountPercent && formData.discountType === 'percent' ? "border-red-500" : ""}`}
                    placeholder="20" 
                    value={formData.discountPercent}
                    onChange={handleChange}
                    disabled={formData.discountType !== 'percent'}
                  />
                  {errors.discountPercent && formData.discountType === 'percent' && 
                    <p className="text-red-500 text-sm mt-1">{errors.discountPercent}</p>}
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Row 3: Validity Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-2 block">Valid From *</Label>
              <Input 
                name="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={handleChange}
                className={errors.validFrom ? "border-red-500" : ""}
              />
              {errors.validFrom && <p className="text-red-500 text-sm mt-1">{errors.validFrom}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Valid To *</Label>
              <Input 
                name="validTo"
                type="date"
                value={formData.validTo}
                onChange={handleChange}
                className={errors.validTo ? "border-red-500" : ""}
              />
              {errors.validTo && <p className="text-red-500 text-sm mt-1">{errors.validTo}</p>}
            </div>
          </div>

          {/* Row 4: Usage Limit */}
          <div>
            <Label className="mb-2 block">Usage Limit *</Label>
            <Input 
              name="usageLimit"
              type="number"
              placeholder="100" 
              className={`max-w-xs ${errors.usageLimit ? "border-red-500" : ""}`}
              value={formData.usageLimit}
              onChange={handleChange}
            />
            {errors.usageLimit && <p className="text-red-500 text-sm mt-1">{errors.usageLimit}</p>}
          </div>

        </form>
      </div>
    </AdminLayout>
  )
}
