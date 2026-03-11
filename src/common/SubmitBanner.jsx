import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

/**
 * Sticky banner shown at the top of the page during form submission.
 *
 * Props:
 *  - status: "idle" | "loading" | "success" | "error"
 *  - message: string (optional override for the label text)
 *
 * When status is "idle" the banner is hidden.
 */
export default function SubmitBanner({ status = "idle", message }) {
  if (status === "idle") return null

  const config = {
    loading: {
      bg: "bg-[#2F5FAC]",
      icon: <Loader2 className="w-4 h-4 animate-spin text-white" />,
      text: message || "กำลังบันทึก… กรุณาอย่าปิดหน้านี้",
      textColor: "text-white",
    },
    success: {
      bg: "bg-emerald-500",
      icon: <CheckCircle2 className="w-4 h-4 text-white" />,
      text: message || "บันทึกสำเร็จ!",
      textColor: "text-white",
    },
    error: {
      bg: "bg-red-500",
      icon: <AlertCircle className="w-4 h-4 text-white" />,
      text: message || "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง",
      textColor: "text-white",
    },
  }

  const c = config[status] || config.loading

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] ${c.bg} shadow-md transition-all duration-300`}
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-center gap-2 px-4 py-3">
        {c.icon}
        <span className={`text-sm font-medium ${c.textColor}`}>{c.text}</span>
      </div>
    </div>
  )
}
