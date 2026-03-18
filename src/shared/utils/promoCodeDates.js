/**
 * Convert date string (YYYY-MM-DD) to Bangkok timezone timestamps.
 * valid_from = 00:00 of that day (Bangkok)
 * valid_until = 23:59:59.999 of that day (Bangkok)
 * Client is Thailand-based (UTC+7).
 */
export function toBangkokStartOfDay(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null
  const trimmed = dateStr.trim()
  if (!trimmed) return null
  return `${trimmed}T00:00:00+07:00`
}

export function toBangkokEndOfDay(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null
  const trimmed = dateStr.trim()
  if (!trimmed) return null
  return `${trimmed}T23:59:59.999+07:00`
}
