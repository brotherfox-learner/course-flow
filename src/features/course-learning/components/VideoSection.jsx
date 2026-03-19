import Image from "next/image"
import { contentToHtml } from "@/shared/utils/contentToHtml"

/**
 * Renders the video player (or cover image placeholder) with skip overlay.
 * Progress saving and keyboard seek logic are handled by the parent via event props.
 */
export default function VideoSection({
  videoUrl,
  title,
  courseCoverImageUrl,
  videoRef,
  skipIndicator,
  onLoadedMetadata,
  onTimeUpdate,
  onPause,
  onEnded,
  content,
  videoSectionRef,
}) {
  return (
    <section ref={videoSectionRef} className="w-full flex-none order-1 self-stretch" aria-label="Video">
      {videoUrl ? (
        <div className="relative w-full aspect-video max-h-[213.5px] md:max-h-[320px] lg:max-h-[460px] rounded-[8px] overflow-hidden bg-gray-900">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            controlsList="nodownload"
            className="w-full h-full object-contain"
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            onPause={onPause}
            onEnded={onEnded}
            aria-label={`Video: ${title}`}
          />

          {skipIndicator && (
            <div className="pointer-events-none absolute inset-y-0 w-full">
              <div
                className={`flex h-full items-center ${
                  skipIndicator === "forward" ? "justify-end pr-6" : "justify-start pl-6"
                }`}
              >
                <div className="flex items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 text-white text-sm font-semibold shadow-lg transition-opacity duration-200">
                  {skipIndicator === "backward" && (
                    <span className="text-lg" aria-hidden>‹</span>
                  )}
                  <span>5s</span>
                  {skipIndicator === "forward" && (
                    <span className="text-lg" aria-hidden>›</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full aspect-video max-h-[213.5px] md:max-h-[320px] lg:max-h-[460px] rounded-[8px] overflow-hidden bg-gray-300">
          {courseCoverImageUrl ? (
            <Image
              src={courseCoverImageUrl}
              alt="Course cover"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 520px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200" aria-hidden />
          )}
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="w-[52px] h-[52px] rounded-full bg-black/50 flex items-center justify-center">
              <span
                className="w-0 h-0 border-t-10 border-t-transparent border-l-16 border-l-white border-b-10 border-b-transparent ml-0.5"
                aria-hidden
              />
            </div>
          </div>
        </div>
      )}

      {content && (
        <section
          className="w-full flex-none order-1 self-stretch mt-6 rounded-[8px] border border-gray-300 bg-white p-4 max-h-[320px] overflow-y-auto"
          aria-label="Lesson article"
        >
          <div
            className="body2 text-black prose prose-sm max-w-none prose-p:my-0 prose-h1:my-0 prose-h2:my-0 prose-h3:my-0 prose-ul:my-0 prose-ol:my-0"
            dangerouslySetInnerHTML={{ __html: contentToHtml(content) }}
          />
        </section>
      )}
    </section>
  )
}
