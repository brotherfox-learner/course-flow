import { useRef, useState } from "react"
import { FileText, X, Loader2 } from "lucide-react"

const ACCEPT = ".pdf,.ppt,.pptx"
const MAX_SIZE_MB = 10

function formatFileSize(bytes) {
  if (!bytes) return ""
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

export default function AttachFileUpload({ token, files = [], onUpload, onRemove, disabled }) {
  const inputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")

  const handleClick = () => {
    if (disabled || isUploading) return
    inputRef.current?.click()
  }

  const handleChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."))
    if (![".pdf", ".ppt", ".pptx"].includes(ext)) {
      setError("Invalid file type. Allowed: PDF, PPT, PPTX.")
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`)
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/admin/upload/course-materials", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Upload failed")

      if (onUpload) {
        onUpload({
          url: data.url,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
        })
      }
    } catch (err) {
      setError(err.message || "Upload failed")
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-slate-400">
        Supported file types: PDF, PPT, PPTX. Max file size: {MAX_SIZE_MB} MB
      </p>
      <div className="flex flex-wrap gap-4 items-start">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isUploading}
          className="w-[140px] h-[140px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-[#2F5FAC] bg-[#F8FAFC] cursor-pointer hover:bg-blue-50 hover:border-[#8BA4D4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 animate-spin mb-2" aria-hidden />
          ) : (
            <span className="text-3xl font-light mb-2">+</span>
          )}
          <span className="text-[14px] font-medium">
            {isUploading ? "Uploading..." : "Upload File"}
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={handleChange}
          className="hidden"
          aria-hidden
        />

        {files.length > 0 && (
          <ul className="flex flex-col gap-2">
            {files.map((f, idx) => (
              <li
                key={f.id ?? f.file_url ?? f.url ?? idx}
                className="flex items-center gap-2 py-2 px-3 bg-slate-50 rounded-lg border border-slate-200 min-w-[240px]"
              >
                <FileText className="w-4 h-4 text-slate-500 shrink-0" aria-hidden />
                <div className="flex-1 min-w-0">
                  <a
                    href={f.file_url || f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[14px] text-[#2F5FAC] hover:underline truncate block max-w-[200px]"
                  >
                    {f.file_name || f.fileName}
                  </a>
                  {(f.file_size || f.fileSize) && (
                    <span className="text-[12px] text-slate-400">
                      {formatFileSize(f.file_size || f.fileSize)}
                    </span>
                  )}
                </div>
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(f)}
                    className="ml-auto p-1 text-slate-400 hover:text-red-500 rounded shrink-0"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-orange-500 text-sm">{error}</p>}
    </div>
  )
}
