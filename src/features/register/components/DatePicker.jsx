import React from "react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"

/* ================= helpers ================= */

// Date → DD/MM/YYYY
function formatDate(date) {
  if (!date) return ""

  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}

// ใส่ / อัตโนมัติจากตัวเลข
function formatInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8)

  if (digits.length <= 2) return digits
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

// parse DD/MM/YYYY → Date (ไม่ตัดสิน validity ทางธุรกิจ)
function parseDate(value) {
  const [day, month, year] = value.split("/").map(Number)
  if (!day || !month || !year) return null

  const date = new Date(year, month - 1, day)

  // valid date จริงไหม
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

// วันอนาคต (ใช้เฉพาะ calendar)
function isFutureDate(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date > today
}

/* ================= component ================= */

export default function DatePickerInput({
  className = "",
  name,
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
}) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState(value ?? null)
  const [inputValue, setInputValue] = React.useState(
    value ? formatDate(value) : ""
  )

  const currentYear = new Date().getFullYear()

  // สร้าง event ให้เหมือน input ปกติ
  const emitChange = (dateValue) => {
    if (!onChange || !name) return
    onChange({
      target: {
        name,
        value: dateValue,
      },
    })
  }

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative w-full">
          {/* ===== Input ===== */}
          <input
            type="text"
            value={inputValue}
            placeholder={placeholder}
            inputMode="numeric"
            onChange={(e) => {
              const formatted = formatInput(e.target.value)
              setInputValue(formatted)

              const parsed = parseDate(formatted)

              // ⭐ จุดแก้จริง: emit เฉพาะเมื่อปีครบ 4 หลัก
              if (parsed && formatted.length === 10) {
                setDate(parsed)
                emitChange(parsed)
              }
            }}
            className={`w-full ${className}`}
          />

          {/* ===== Calendar Button ===== */}
          <PopoverTrigger asChild>
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2
                         text-gray-600 hover:text-orange-500"
            >
              <CalendarIcon size={18} />
            </button>
          </PopoverTrigger>
        </div>

        {/* ===== Calendar ===== */}
        <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            fromYear={1900}
            toYear={currentYear}
            disabled={(d) => isFutureDate(d)}
            onSelect={(selectedDate) => {
              if (!selectedDate || isFutureDate(selectedDate)) return

              setDate(selectedDate)
              setInputValue(formatDate(selectedDate))
              emitChange(selectedDate)
              setOpen(false)
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}