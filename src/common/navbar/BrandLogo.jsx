import Link from "next/link";

function BrandLogo() {
  return (
    <Link href="/" aria-label="Go to homepage">
      <span
        className="text-lg lg:text-2xl font-extrabold brand-gradient-text cursor-pointer"
      >
        CourseFlow
      </span>
    </Link>
  );
}

export default BrandLogo;