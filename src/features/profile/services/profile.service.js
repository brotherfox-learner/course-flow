import axios from "axios"

/**
 * Profile Service – data-access layer for user profile API calls.
 * Supabase Storage uploads are handled here to keep hooks clean.
 */

export async function updateProfile(accessToken, profileData) {
  const { data } = await axios.put("/api/auth/profile", profileData, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return data
}

export async function uploadAvatar(supabaseClient, userId, imageFile) {
  const filePath = `avatars/${userId}.jpg`

  const { error } = await supabaseClient.storage
    .from("avatars")
    .upload(filePath, imageFile, { upsert: true })

  if (error) throw error

  const { data } = supabaseClient.storage.from("avatars").getPublicUrl(filePath)
  return `${data.publicUrl}?v=${Date.now()}`
}
