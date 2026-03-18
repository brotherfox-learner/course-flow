import axios from "axios"

/**
 * Auth Service – data-access layer for authentication & profile API calls.
 */

export async function register(payload) {
  const { data } = await axios.post("/api/auth/register", payload)
  return data
}

export async function verifyEmailOtp(email, token) {
  const { data } = await axios.post("/api/auth/verify", { email, token })
  return data
}

export async function fetchUserProfile(accessToken) {
  const { data } = await axios.get("/api/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return data
}

export async function updateUserProfile(accessToken, profileData) {
  const { data } = await axios.put("/api/auth/profile", profileData, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return data
}

export async function requestEmailChange(accessToken, newEmail) {
  const { data } = await axios.post(
    "/api/auth/change-email",
    { newEmail },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  return data
}
