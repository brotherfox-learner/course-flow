import { useState } from "react";
import Link from "next/link";
import Card from "@/common/card";
import Modal from "@/common/modal";
import CourseCardSkeleton from "@/features/course/components/CourseCardSkeleton";

const SKELETON_COUNT = 6;

export default function MyWishlist({ courses, loading, error, onRemoveCourse }) {
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [courseToRemove, setCourseToRemove] = useState(null);

  const handleTrashClick = (course) => {
    setCourseToRemove(course);
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = () => {
    if (courseToRemove?.courseId != null) {
      onRemoveCourse?.(courseToRemove.courseId);
    }
    setShowRemoveModal(false);
    setCourseToRemove(null);
  };

  const handleCancelRemove = () => {
    setShowRemoveModal(false);
    setCourseToRemove(null);
  };
  if (loading) {
    return (
      <section
        className="grid gap-[32px] grid-cols-1 md:grid-cols-2 md:gap-y-[32px] md:gap-x-[15px] lg:grid-cols-2 lg:gap-x-[25px] xl:grid-cols-3 xl:gap-y-[60px] xl:gap-x-[24px] xl:w-[1119px] 2xl:grid-cols-4 2xl:w-[1500px] 2xl:gap-y-[50px] 2xl:gap-x-[24px]"
        aria-label="Loading wishlist"
      >
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <div className="col-span-full text-center py-12">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!courses.length) {
    return (
      <div className="col-span-full text-center py-12">
        <p className="text-gray-500">No courses in your wishlist yet.</p>
        <Link href="/courses" className="text-blue-500 body2 mt-2 inline-block hover:underline">
          Browse courses
        </Link>
      </div>
    );
  }

  return (
    <section
      className="grid gap-[32px] grid-cols-1 md:grid-cols-2 md:gap-y-[32px] md:gap-x-[15px] lg:grid-cols-2 lg:gap-x-[25px] xl:grid-cols-3 xl:gap-y-[60px] xl:gap-x-[24px] xl:w-[1119px] 2xl:grid-cols-4 2xl:w-[1500px] 2xl:gap-y-[50px] 2xl:gap-x-[24px]"
      aria-labelledby="my-wishlist-heading"
    >
      {courses.map((course) => (
        <Link
          key={course.enrollmentId ?? course.courseId}
          href={`/courses/${course.courseId}`}
          className="flex justify-center lg:justify-start"
        >
          <Card
            courseName={course.courseName}
            description={course.courseSummary}
            lessonCount={course.lessonCount}
            durationHours={course.totalLearningTime}
            imageUrl={course.coverImgUrl}
            showTrash
            onTrashClick={() => handleTrashClick(course)}
          />
        </Link>
      ))}
      <Modal
        open={showRemoveModal}
        onClose={handleCancelRemove}
        title="Remove from wishlist"
        message={
          courseToRemove
            ? `Are you sure you want to remove "${courseToRemove.courseName}" from your wishlist? You can add it again anytime.`
            : ""
        }
        primaryLabel="Remove"
        secondaryLabel="Cancel"
        onPrimaryClick={handleConfirmRemove}
        onSecondaryClick={handleCancelRemove}
      />
    </section>
  );
}
