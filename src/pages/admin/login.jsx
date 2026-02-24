import Head from "next/head"
import { AdminLoginForm } from "@/features/login/components/AdminLoginForm"

export default function AdminLoginPage() {
  return (
    <>
      <Head>
        <title>Admin Login | CourseFlow</title>
      </Head>
      <AdminLoginForm />
    </>
  )
}
