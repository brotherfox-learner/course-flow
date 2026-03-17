import Pagination from "@/shared/components/pagination"
import AssignmentCard from "./AssignmentCard"

const PAGE_SIZE = 4

/**
 * Renders the paginated list of assignment cards with tabs.
 * Receives data and handlers from useAssignmentList.
 */
export default function AssignmentsList({
  filtered,
  loading,
  error,
  activeTab,
  tabs,
  currentPage,
  token,
  onTabChange,
  onPageChange,
  onRefresh,
}) {
  return (
    <>
      <nav
        className="flex gap-8 border-b border-gray-300 mb-8 justify-center lg:justify-center"
        aria-label="Assignment tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`pb-3 body2 font-medium transition-colors relative ${
              activeTab === tab.key
                ? "text-black border-b-2 border-black"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="body3 text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center max-w-md mx-auto">
          <p className="body2 text-gray-600 font-medium mb-2">No assignments right now</p>
          <p className="body3 text-gray-500">
            Assignments appear when you are enrolled in a course that has them.
            Go to My Courses to see your enrolled courses.
          </p>
          <a
            href="/my-courses"
            className="inline-block mt-4 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white body3 font-medium rounded-xl transition-colors"
          >
            Go to My Courses
          </a>
        </div>
      ) : (
        <>
          <div className="mx-auto lg:mx-0 flex flex-col gap-4 w-full items-center justify-center">
            {filtered
              .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
              .map((a) => (
                <AssignmentCard
                  key={a.assignment_id}
                  assignment={a}
                  token={token}
                  onRefresh={onRefresh}
                />
              ))}
          </div>
          {filtered.length > 0 && (
            <div className="flex justify-center mt-8 mb-15">
              {filtered.length > PAGE_SIZE ? (
                <Pagination
                  currentPage={currentPage}
                  totalItems={filtered.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={onPageChange}
                />
              ) : (
                <p className="text-sm text-slate-500">
                  Page 1 of 1 ({filtered.length} assignment{filtered.length !== 1 ? "s" : ""})
                </p>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}
