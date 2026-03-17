import Link from "next/link"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { Button } from "@/shared/ui/button"

/**
 * Reusable promo code section: checkbox toggle + form fields.
 * Used by both AddCourse (no existingCodes) and EditCourse (shows existing codes + add button).
 */
export default function PromoCodeSection({
  hasPromoCode,
  promoData,
  onToggle,
  onFieldChange,
  // edit-page only props
  existingCodes = [],
  isAddingPromo = false,
  onAddPromo = null,
}) {
  return (
    <section className="mb-10 p-8 bg-[#F6F8FE] rounded-xl" aria-label="Promo code">
      <div className="flex items-center justify-start gap-3 mb-4">
        <input
          type="checkbox"
          id="promo"
          className="w-5 h-5 rounded border-slate-300 accent-[#2F5FAC] focus:ring-[#2F5FAC]"
          checked={hasPromoCode}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <Label htmlFor="promo" className="font-medium text-gray-800 body2">Promo code</Label>
      </div>

      {hasPromoCode && (
        <>
          {existingCodes.length > 0 && (
            <div className="mb-6">
              <p className="text-[13px] text-slate-500 mb-4">
                Promo codes that are associated with this course.
              </p>
              <ul className="space-y-2">
                {existingCodes.map((promo) => (
                  <li key={promo.id}>
                    <Link
                      href={`/admin/promocodes/${promo.id}`}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-[#2F5FAC] hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-medium text-slate-800">{promo.code}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        promo.status === "active"
                          ? "bg-green-100 text-green-700"
                          : promo.status === "expired"
                          ? "bg-slate-100 text-slate-500"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {promo.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {existingCodes.length > 0 && (
            <p className="text-[13px] text-slate-500 mb-4">Add promo code for this course</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <div>
              <Label className="mb-1 block body2 text-black font-normal">Set promo code</Label>
              <Input
                placeholder="Enter promo code"
                value={promoData.code}
                onChange={(e) => onFieldChange("code", e.target.value)}
                className="h-12 border-gray-400 rounded-lg bg-white body2 placeholder:text-gray-600"
              />
            </div>

            <div>
              <Label className="mb-1 block body2 text-black font-normal">
                Minimum purchase amount (THB)
              </Label>
              <Input
                placeholder="0"
                type="number"
                value={promoData.minPurchase}
                onChange={(e) => onFieldChange("minPurchase", e.target.value)}
                className="h-12 border-gray-400 rounded-lg bg-white body2 placeholder:text-gray-600"
              />
            </div>

            <div className="col-span-2">
              <Label className="mb-4 block body2 text-black font-normal">Select discount type</Label>
              <RadioGroup
                value={promoData.discountType}
                onValueChange={(v) => onFieldChange("discountType", v)}
                className="flex flex-col sm:flex-row gap-12"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem
                    value="thb"
                    id="promo-thb"
                    className="w-5 h-5 border-slate-300 text-[#2F5FAC] data-[state=checked]:border-[#2F5FAC]"
                  />
                  <Label htmlFor="promo-thb" className="body2 text-black font-normal">Discount (THB)</Label>
                  <Input
                    className="w-32 ml-2 h-12 border-gray-400 rounded-lg bg-white body2 placeholder:text-gray-600"
                    placeholder="200"
                    type="number"
                    value={promoData.discountAmount}
                    onChange={(e) => onFieldChange("discountAmount", e.target.value)}
                    disabled={promoData.discountType !== "thb"}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem
                    value="percent"
                    id="promo-percent"
                    className="w-5 h-5 border-slate-300 text-[#2F5FAC] data-[state=checked]:border-[#2F5FAC]"
                  />
                  <Label htmlFor="promo-percent" className="body2 text-black font-normal">Discount (%)</Label>
                  <Input
                    className="w-32 ml-2 h-12 border-gray-400 rounded-lg bg-white body2 placeholder:text-gray-600"
                    placeholder="30"
                    type="number"
                    value={promoData.discountPercent}
                    onChange={(e) => onFieldChange("discountPercent", e.target.value)}
                    disabled={promoData.discountType !== "percent"}
                  />
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="mb-1 block body2 text-black font-normal">Valid From</Label>
              <Input
                type="date"
                value={promoData.validFrom}
                onChange={(e) => onFieldChange("validFrom", e.target.value)}
                className="h-12 border-gray-400 rounded-lg bg-white body2"
              />
            </div>

            <div>
              <Label className="mb-1 block body2 text-black font-normal">Valid To</Label>
              <Input
                type="date"
                value={promoData.validTo}
                onChange={(e) => onFieldChange("validTo", e.target.value)}
                className="h-12 border-gray-400 rounded-lg bg-white body2"
              />
            </div>

            <div>
              <Label className="mb-1 block body2 text-black font-normal">Usage Limit</Label>
              <Input
                type="number"
                placeholder="Unlimited"
                value={promoData.usageLimit}
                onChange={(e) => onFieldChange("usageLimit", e.target.value)}
                className="h-12 border-gray-400 rounded-lg bg-white body2 placeholder:text-gray-600"
              />
            </div>
          </div>

          <p className="text-[13px] text-slate-400 mt-4 col-span-2">
            This discount code will be locked for this course only
          </p>

          {onAddPromo && (
            <Button
              onClick={onAddPromo}
              disabled={isAddingPromo}
              variant="primary"
              size="admin"
              className="mt-4"
            >
              {isAddingPromo ? "Adding..." : "Add Promo Code"}
            </Button>
          )}
        </>
      )}
    </section>
  )
}
