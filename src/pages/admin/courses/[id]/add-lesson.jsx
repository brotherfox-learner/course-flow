// DEPRECATED: This file is superseded by lessons/add.jsx
// Please delete this file from the repository.
import { useRouter } from "next/router"
import { useEffect } from "react"

export default function DeprecatedAddLesson() {
  const router = useRouter()
  const { id } = router.query
  useEffect(() => {
    if (id) router.replace(`/admin/courses/${id}/lessons/add`)
  }, [id, router])
  return null
}