import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import ImageUpload from "@/shared/components/upload/ImageUpload"
import VideoUpload from "@/shared/components/upload/VideoUpload"
import AttachFileUpload from "./AttachFileUpload"

/**
 * Reusable media section: cover image, video trailer, and file attachments.
 * Used by both AddCourse and EditCourse pages.
 */
export default function CourseMediaSection({
  coverImgUrl,
  coverImageData,
  vdoTrailerUrl,
  videoTrailerData,
  files,
  token,
  errors = {},
  disabled = false,
  onCoverUrlChange,
  onImageUpload,
  onVideoUrlChange,
  onVideoUpload,
  onFileUpload,
  onFileRemove,
}) {
  return (
    <section className="space-y-8 mt-10" aria-label="Course media">
      <div>
        <Label className="mb-1 block body2 text-black font-normal">
          Cover image <span className="text-[#C82A2A]">*</span>
        </Label>
        <p className="text-[13px] text-slate-400 mb-3">
          Supported file types: .jpg, .png, .jpeg. Max file size: 5 MB
        </p>
        <div className="my-4">
          <Input
            name="coverImgUrl"
            placeholder="Cover image URL"
            value={coverImgUrl ?? ""}
            onChange={onCoverUrlChange}
            className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
          />
          {errors.coverImgUrl && (
            <p className="text-orange-500 text-sm mt-1 mb-2">{errors.coverImgUrl}</p>
          )}
        </div>
        <ImageUpload
          value={coverImageData}
          onChange={onImageUpload}
          maxSize={5 * 1024 * 1024}
          className="max-w-[300px] max-h-[300px] min-h-[300px] min-w-[300px]"
        />
      </div>

      <div>
        <Label className="mb-1 block body2 text-black font-normal">
          Video Trailer <span className="text-[#C82A2A]">*</span>
        </Label>
        <div className="my-4">
          <Input
            name="vdoTrailerUrl"
            placeholder="Video trailer URL"
            value={vdoTrailerUrl ?? ""}
            onChange={onVideoUrlChange}
            className="h-12 border-gray-400 rounded-lg body2 placeholder:text-gray-600"
          />
          {errors.vdoTrailerUrl && (
            <p className="text-orange-500 text-sm mt-1">{errors.vdoTrailerUrl}</p>
          )}
        </div>
        <VideoUpload
          value={videoTrailerData}
          onChange={onVideoUpload}
          className="mb-3 max-w-[300px] max-h-[300px] min-h-[300px] min-w-[300px]"
        />
        <p className="text-[13px] text-slate-400 mt-2">
          Upload a video file or enter a URL. Supported formats: .mp4, .mov, .avi, .webm. Max file size: 50 MB
        </p>
      </div>

      <div>
        <Label className="mb-1 block body2 text-black font-normal">
          Attach File (Optional)
        </Label>
        <AttachFileUpload
          token={token}
          files={files}
          onUpload={onFileUpload}
          onRemove={onFileRemove}
          disabled={disabled}
        />
      </div>
    </section>
  )
}
