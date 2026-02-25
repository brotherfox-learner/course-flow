import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext"

const inter = Inter({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <div className={inter.className}>
        <Component {...pageProps} />
      </div>
    </AuthProvider>
  );
}

