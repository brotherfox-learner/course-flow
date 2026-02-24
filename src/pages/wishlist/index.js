import { useEffect } from "react";
import { useRouter } from "next/router";
import NavBar from "@/common/navbar/NavBar";
import Footer from "@/common/Footer";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/features/wishlist/hooks";
import MyWishlist from "@/features/wishlist/components/MyWishlist";

export default function WishlistPage() {
  const router = useRouter();
  const { user, token, isLoggedIn, loading: authLoading } = useAuth();
  const { courses, loading, error, removeFromWishlist } = useWishlist(user?.id, token);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
  }, [authLoading, isLoggedIn, router]);

  if (authLoading || !isLoggedIn) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen bg-white flex items-center justify-center">
          <p className="body2 text-gray-500">Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-white flex flex-col items-center mx-auto relative overflow-x-hidden mb-[30px] lg:mb-20">
        <div>
          <img src="/ellipse.svg" className="absolute w-9 h-9 right-[-12px] top-[161px] lg:w-[74px] lg:h-[74px] lg:top-[205px] lg:right-[-21px]" alt="" />
          <img src="/green_cross.svg" className="absolute w-[15.56px] h-[15.56px] left-[71px] top-[177px] lg:w-[18px] lg:h-[18px] lg:top-[205px] lg:left-[250px]" alt="" />
          <div className="absolute w-[8.56px] h-[8.56px] left-[36px] top-[40px] rounded-full border-[3px] lg:w-[10px] lg:h-[10px] lg:left-[75px] lg:top-[50px] border-[#2F5FAC] box-sizing-border" aria-hidden="true" />
          <img src="/orange_polygon.svg" className="absolute w-[27.75px] h-[27.75px] right-[45px] top-[60px] lg:w-[35px] lg:h-[35px] lg:right-[106px] lg:top-[125px]" alt="" />
          <img src="/ellipse.svg" className="absolute w-[20.25px] h-[20.25px] left-[-10px] top-[85.92px] lg:w-[25px] lg:h-[25px] lg:left-[32px] lg:top-[107px]" alt="" />
        </div>
        <div className="relative w-full max-w-[375px] h-[120px] flex flex-col items-center justify-center gap-[32px] overflow-hidden lg:max-w-full lg:h-auto lg:min-h-[120px] lg:mt-[30px] lg:mb-[20px] xl:mt-[50px] xl:mb-[30px] md:max-w-full">
          <h1 id="my-wishlist-heading" className="headline3-lg-headline2 text-gray-900 text-center">
            My Wishlist
          </h1>
        </div>

        <div className="w-full flex flex-col items-center px-4 pb-16 lg:pb-24">
          <MyWishlist courses={courses} loading={loading} error={error} onRemoveCourse={removeFromWishlist} />
        </div>
      </main>
      <Footer />
    </>
  );
}
