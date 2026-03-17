import { Inter, Nunito } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/features/auth/context/AuthContext"
import { Toaster } from "sonner"

const inter = Inter({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-nunito",
  display: "swap",
});

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <div className={`${inter.className} ${nunito.variable}`}>
      <Toaster position="top-center" richColors />
        <Component {...pageProps} />
      </div>
    </AuthProvider>
  );
}

