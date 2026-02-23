import CourseCardSkeleton from "./CourseCardSkeleton";

export default function CourseDetailSkeleton() {
  return (
    <main className="min-h-screen bg-white font-['Inter']" aria-hidden="true">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-8 md:pt-6 lg:px-12 lg:pt-[53px] xl:px-[160px] 2xl:max-w-[1600px] 2xl:px-[180px]">
        <nav className="mb-4 md:mb-6 lg:mb-[23px]">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        </nav>

        <section className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-6 xl:max-w-[1120px] 2xl:max-w-[1240px]">
          <div className="flex flex-col items-start w-full gap-8 md:gap-12 lg:gap-[100px] lg:min-w-0 lg:max-w-[739px] lg:flex-1 2xl:max-w-[820px]">
            <div className="relative w-full rounded-[8px] overflow-hidden bg-gray-200 animate-pulse aspect-video lg:aspect-auto lg:h-[360px] xl:h-[460px] 2xl:h-[510px]" />

            <section className="w-full flex flex-col gap-4">
              <div className="h-6 w-40 bg-gray-300 rounded animate-pulse" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-[90%] bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-[80%] bg-gray-200 rounded animate-pulse" />
              </div>
            </section>

            <section className="w-full flex flex-col gap-4">
              <div className="h-6 w-48 bg-gray-300 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </section>
          </div>

          <aside className="hidden lg:block lg:w-[357px] lg:shrink-0 lg:sticky lg:top-8 2xl:w-[400px]">
            <article className="bg-white rounded-[8px] py-8 px-6 flex flex-col gap-6 shadow-[4px_4px_24px_rgba(0,0,0,0.08)]">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="space-y-3">
                <div className="h-6 w-40 bg-gray-300 rounded animate-pulse" />
                <div className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-6 w-32 bg-gray-300 rounded animate-pulse" />
              <div className="flex flex-col gap-4 pt-10 border-t border-[#D6D9E4]">
                <div className="h-[52px] w-full bg-gray-100 rounded-[12px] animate-pulse" />
                <div className="h-[52px] w-full bg-gray-200 rounded-[12px] animate-pulse" />
              </div>
            </article>
          </aside>
        </section>
      </div>

      <section className="w-full mt-10 lg:mt-[100px] bg-gray-100 min-h-[560px] lg:min-h-[680px] py-16 lg:py-24 xl:py-[100px]">
        <div className="mx-auto px-4 md:px-8 lg:px-12 xl:px-[160px] 2xl:px-[180px]">
          <div className="h-7 w-64 bg-gray-300 rounded mx-auto mb-6 lg:mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 max-w-[1119px] mx-auto">
            {Array.from({ length: 3 }).map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 w-full">
        <div className="w-full flex flex-col items-stretch p-4 gap-2 rounded-t-[8px] md:rounded-none bg-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col justify-center items-center gap-2 w-full">
            <header className="flex flex-row justify-end items-start gap-4 w-full min-h-[52px]">
              <div className="flex flex-col items-start gap-2 flex-1 min-w-0">
                <div className="h-4 w-40 bg-gray-300 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
            </header>
            <div className="flex flex-row items-stretch gap-2 w-full h-[34px]">
              <div className="flex-1 h-[34px] bg-gray-100 rounded-[8px] animate-pulse" />
              <div className="flex-1 h-[34px] bg-gray-200 rounded-[8px] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

