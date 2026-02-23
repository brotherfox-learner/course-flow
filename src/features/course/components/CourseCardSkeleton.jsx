export default function CourseCardSkeleton() {
  return (
    <article
      className="w-full max-w-[343px] lg:max-w-[357px] min-h-[431px] lg:min-h-[475px] mx-auto bg-white rounded-[8px] overflow-hidden flex flex-col shadow-1"
      aria-hidden="true"
    >
      <div className="relative w-full max-lg:h-[240px] lg:h-[240px] rounded-t-[8px] bg-gray-200 animate-pulse" />

      <section className="px-[16px] pt-[8px] pb-[16px] lg:pt-[3px] lg:px-5 flex flex-col gap-[5px] lg:gap-[8px] flex-1">
        <div className="h-3 w-14 bg-gray-300 rounded animate-pulse" />
        <div className="h-6 w-[85%] max-w-[280px] bg-gray-300 rounded animate-pulse" />
        <div className="h-4 w-[60%] max-w-[200px] bg-gray-200 rounded animate-pulse" />
      </section>

      <footer className="w-full max-w-[343px] lg:max-w-[357px] h-[53px] p-[16px] mt-auto flex gap-[24px] border-t border-gray-300">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-300 rounded animate-pulse" aria-hidden="true" />
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-300 rounded animate-pulse" aria-hidden="true" />
          <div className="h-4 w-14 bg-gray-200 rounded animate-pulse" />
        </div>
      </footer>
    </article>
  );
}
