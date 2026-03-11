// DEPRECATED: This file is superseded by [id]/index.jsx
// Next.js prioritises the folder route, so this file is never served.
// Please delete this file from the repository.
import { useRouter } from "next/router"
import { useEffect } from "react"

export default function DeprecatedEditCourse() {
  const router = useRouter()
  const { id } = router.query
  useEffect(() => {
    if (id) router.replace(`/admin/courses/${id}`)
  }, [id, router])
  return null
}
