import PropTypes from "prop-types";

const BADGE_STYLES = {
  inprogress: "bg-purple-100 text-purple-600 border border-purple-200",
  completed: "bg-green-100 text-green-600 border border-green-200",
};

const BADGE_LABELS = {
  inprogress: "In Progress",
  completed: "Completed",
};

export default function Card({
  category = "Course",
  courseName,
  description,
  lessonCount,
  durationHours,
  imageUrl,
  onClick,
  badge,
  className = "",
  wishlistHeart = false,
  isInWishlist = false,
  onWishlistClick,
  showTrash = false,
  onTrashClick,
}) {
  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onWishlistClick?.(e);
  };

  const handleTrashClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onTrashClick?.(e);
  };

  return (
    <article
      className={`group w-full max-w-[343px] lg:max-w-[357px] min-h-[431px] lg:min-h-[475px] mx-auto bg-white rounded-[8px] overflow-hidden cursor-pointer shadow-1 transition-all duration-200 hover:-translate-y-2 hover:shadow-xl hover:bg-gray-100 flex flex-col gap-2 lg:gap-[24px] ${className}`}
      onClick={onClick}
    >
      <div className="relative w-full max-lg:h-[240px] lg:h-[240px] overflow-hidden rounded-t-[8px]">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={courseName ? `Course cover for ${courseName}` : "Course cover image"}
            className="w-full h-full object-cover"
          />
        )}
        {wishlistHeart && (
          <button
            type="button"
            onClick={handleWishlistClick}
            className="absolute top-3 right-3 z-10 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <img
              src={isInWishlist ? "/heart-filled.svg" : "/hoverheart.svg"}
              alt=""
              className={`object-contain object-center ${isInWishlist ? "w-8 h-8 lg:w-11 lg:h-11" :  "mt-[-2px] w-5 h-5 lg:w-6 lg:h-6 lg:mt-[-5px]"}`}
            />
          </button>
        )}
        {badge && BADGE_LABELS[badge] && (
          <span
            className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[12px] font-semibold backdrop-blur-sm ${BADGE_STYLES[badge]}`}
          >
            {BADGE_LABELS[badge]}
          </span>
        )}
      </div>

      <section
        className="px-[16px] pt-[8px] pb-[16px] lg:pt-[3px] lg:px-5 lg:gap-[8px] flex flex-col gap-[5px] flex-1"
      >
        {category && (
          <p className="text-[12px] font-normal  tracking-[0] text-orange-500 lg:text-[14px] lg:font-medium  lg:tracking-[-0.02em]">
            {category}
          </p>
        )}
        {courseName && (
          <h2 className="text-[20px] font-normal  tracking-[0] text-black lg:text-[24px] lg:font-medium  lg:tracking-[-0.02em]">
            {courseName}
          </h2> 
        )}
        {description && (
          <p className="text-[14px] font-normal  tracking-[0] text-gray-700 lg:text-[16px]">
            {description}
          </p>
        )}
      </section>

      <footer
        className="w-full max-w-[343px] lg:max-w-[357px] min-h-[53px] p-[16px] mt-auto flex items-center gap-[24px] text-[12px] font-normal tracking-[0] text-gray-500 border-t border-gray-300"
      >
        <div className="flex items-center gap-2 w-[88px] h-[21px]">
          <img
            src="/book.svg"
            alt="Lesson count icon"
            className="w-[20px] h-[20px]"
          />
          <span className="text-[14px] font-normal lg:text-[16px] tracking-[0] text-gray-700 whitespace-nowrap">
            {lessonCount ?? ""} Lessons
          </span>
        </div>
        <div className="flex items-center gap-2 w-[88px] h-[21px]">
          <img
            src="/clock.svg"
            alt="Duration icon"
            className="w-[20px] h-[20px]"
          />
          <span className="text-[14px] font-normal lg:text-[16px] tracking-[0] text-gray-700 whitespace-nowrap">
            {durationHours ?? ""} Hours
          </span>
        </div>
        {showTrash && (
          <button
            type="button"
            onClick={handleTrashClick}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-200"
            aria-label="Remove from wishlist"
          >
            <img
              src="/Trash.svg"
              alt=""
              className="w-5 h-5 object-contain [filter:invert(27%)_sepia(98%)_saturate(2476%)_hue-rotate(346deg)_brightness(95%)_contrast(95%)]"
            />
          </button>
        )}
      </footer>
    </article>
  );
}

Card.propTypes = {
  category: PropTypes.string,
  courseName: PropTypes.string,
  description: PropTypes.string,
  lessonCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  durationHours: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  imageUrl: PropTypes.string,
  onClick: PropTypes.func,
  badge: PropTypes.oneOf(["inprogress", "completed"]),
  className: PropTypes.string,
  wishlistHeart: PropTypes.bool,
  isInWishlist: PropTypes.bool,
  onWishlistClick: PropTypes.func,
  showTrash: PropTypes.bool,
  onTrashClick: PropTypes.func,
};
