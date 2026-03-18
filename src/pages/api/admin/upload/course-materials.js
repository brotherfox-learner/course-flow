import { createClient } from "@supabase/supabase-js"
import formidable, { errors as formidableErrors } from "formidable"
import fs from "node:fs"
import { randomUUID } from "node:crypto"
import pool from "@/infrastructure/db"

export const config = {
  api: {
    bodyParser: false,
  },
}

const BUCKET_ID = "course-materials"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIMETYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]
const ALLOWED_EXTENSIONS = [".pdf", ".ppt", ".pptx"]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function getExtension(filename) {
  if (!filename) return ""
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."))
  return ext
}

function isValidFileType(mimetype, originalFilename) {
  const ext = getExtension(originalFilename)
  const validExt = ALLOWED_EXTENSIONS.includes(ext)
  if (!validExt) return false
  // Accept if MIME matches, or if MIME is ambiguous (some OS sends zip/octet-stream for pptx)
  const ambiguousMimes = ["application/octet-stream", "application/zip", ""]
  const validMime = ALLOWED_MIMETYPES.includes(mimetype) || ambiguousMimes.includes(mimetype)
  return validMime
}

function getFirstFile(files) {
  if (!files || typeof files !== "object") return null
  for (const val of Object.values(files)) {
    const f = Array.isArray(val) ? val[0] : val
    if (f?.filepath) return f
  }
  return null
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const token = authHeader.split(" ")[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return res.status(401).json({ message: "Invalid token" })
  }

  // Check admin role
  const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [user.id])
  if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "admin") {
    return res.status(403).json({ message: "Forbidden" })
  }

  const form = formidable({
    maxFileSize: MAX_FILE_SIZE,
    maxFiles: 1,
    allowEmptyFiles: false,
    keepExtensions: true,
    filename: (name, ext) => {
      return `${randomUUID()}${ext || ""}`
    },
  })

  let parsed
  try {
    parsed = await form.parse(req)
  } catch (err) {
    // formidable v3 uses numeric error codes
    if (err.code === formidableErrors.biggerThanMaxFileSize || err.code === 1009) {
      return res.status(400).json({ message: "File too large. Maximum size is 10MB." })
    }
    if (err.code === formidableErrors.maxFilesExceeded || err.code === 1015) {
      return res.status(400).json({ message: "Too many files. Only one file allowed." })
    }
    console.error("Form parse error:", err)
    return res.status(400).json({ message: "Invalid request. Allowed file types: PDF, PPT, PPTX." })
  }

  const [, files] = parsed
  const file = getFirstFile(files)

  if (!file || !file.filepath) {
    return res.status(400).json({ message: "Missing file. Please upload a PDF, PPT, or PPTX file." })
  }

  const originalFilename = file.originalFilename || file.newFilename || "file"
  const mimetype = file.mimetype || ""

  if (!isValidFileType(mimetype, originalFilename)) {
    try {
      fs.unlinkSync(file.filepath)
    } catch (e) {
      console.error("Cleanup temp file error:", e)
    }
    return res.status(400).json({
      message: "Invalid file type. Allowed: PDF, PPT, PPTX.",
    })
  }

  const storageFileName = file.newFilename || `${randomUUID()}${getExtension(originalFilename) || ".pdf"}`
  const fileBuffer = fs.readFileSync(file.filepath)

  try {
    fs.unlinkSync(file.filepath)
  } catch (e) {
    console.error("Cleanup temp file error:", e)
  }

         const fileSize = file.size || fileBuffer.length

         const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET_ID)
    .upload(storageFileName, fileBuffer, {
      contentType: mimetype,
      upsert: false,
    })

  if (uploadError) {
    console.error("Supabase upload error:", uploadError)
    return res.status(500).json({
      message: "Upload failed. Please try again.",
    })
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_ID)
    .getPublicUrl(uploadData.path)

         return res.status(200).json({
           url: urlData.publicUrl,
           fileName: originalFilename,
           fileType: mimetype,
           fileSize,
           storagePath: uploadData.path,
         })
}
