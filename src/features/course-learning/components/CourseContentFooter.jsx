"use client";

import Button from "@/common/navbar/Button";

export default function CourseContentFooter({
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  className = "",
}) {
  return (
    <footer
      className={`w-full bg-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)] mt-6 lg:min-h-[100px] lg:flex lg:items-center ${className}`}
      aria-label="Lesson navigation"
    >
      <div className="w-full max-w-[375px] md:max-w-[768px] lg:max-w-[1440px] mx-auto px-4 py-4 lg:py-5 lg:px-[10vw] xl:px-[160px] flex flex-row justify-between items-center">
        <Button
          type="button"
          variant="ghost"
          size="ghost"
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label="Previous lesson"
          className="body2 min-w-[145px] h-8 rounded-2xl"
        >
          Previous Lesson
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next lesson"
          className="body2 min-w-[161px] h-[60px] rounded-xl"
        >
          Next Lesson
        </Button>
      </div>
    </footer>
  );
}
