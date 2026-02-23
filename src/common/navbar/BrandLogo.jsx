import Link from "next/link";

function BrandLogo() {
  return (
    <Link href="/" aria-label="Go to homepage" className="focus-visible:border-2 focus-visible:border-black cursor-pointe">
      <span
        className="text-lg lg:text-2xl font-extrabold brand-gradient-text"
      >
        CourseFlow
      </span>
    </Link>
  );
}

export default BrandLogo;