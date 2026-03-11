import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

/**
 * Extract public_id from a Cloudinary URL
 * e.g. https://res.cloudinary.com/xxx/image/upload/v123/course-flow/images/abc.jpg
 *      → "course-flow/images/abc"
 */
export function extractPublicId(url) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null

  try {
    const parts = url.split('/')
    const uploadIndex = parts.findIndex(p => p === 'upload')
    if (uploadIndex === -1 || uploadIndex >= parts.length - 1) return null

    // Skip version segment (v1234567890)
    const startIndex = /^v\d+$/.test(parts[uploadIndex + 1])
      ? uploadIndex + 2
      : uploadIndex + 1

    const publicIdWithExt = parts.slice(startIndex).join('/')
    const dotIndex = publicIdWithExt.lastIndexOf('.')
    return dotIndex > 0 ? publicIdWithExt.substring(0, dotIndex) : publicIdWithExt
  } catch {
    return null
  }
}

/**
 * Detect resource_type from URL path segment
 */
function detectResourceType(url) {
  if (!url) return 'auto'
  if (url.includes('/video/upload/')) return 'video'
  if (url.includes('/image/upload/')) return 'image'
  if (url.includes('/raw/upload/')) return 'raw'
  return 'auto'
}

/**
 * Delete a single file from Cloudinary by its URL
 * Returns { success, public_id, error? }
 */
export async function deleteByUrl(url) {
  const publicId = extractPublicId(url)
  if (!publicId) return { success: false, error: 'Could not extract public_id' }

  const resourceType = detectResourceType(url)

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    })
    return { success: result.result === 'ok', public_id: publicId }
  } catch (error) {
    console.error(`Cloudinary delete failed for ${publicId}:`, error.message)
    return { success: false, public_id: publicId, error: error.message }
  }
}

/**
 * Delete multiple files from Cloudinary by their URLs
 * Non-Cloudinary URLs are silently skipped.
 * Errors are logged but don't throw.
 */
export async function deleteMultipleByUrl(urls) {
  if (!Array.isArray(urls)) return { deleted: 0, errors: [] }

  const cloudinaryUrls = urls.filter(u => u && typeof u === 'string' && u.includes('cloudinary.com'))
  if (cloudinaryUrls.length === 0) return { deleted: 0, errors: [] }

  let deleted = 0
  const errors = []

  for (const url of cloudinaryUrls) {
    const result = await deleteByUrl(url)
    if (result.success) {
      deleted++
    } else {
      errors.push({ url, error: result.error })
    }
  }

  console.log(`Cloudinary cleanup: ${deleted}/${cloudinaryUrls.length} files deleted`)
  if (errors.length > 0) console.error('Cloudinary cleanup errors:', errors)

  return { deleted, errors }
}
