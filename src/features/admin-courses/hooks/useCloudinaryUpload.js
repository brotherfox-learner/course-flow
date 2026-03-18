/**
 * Provides a utility to upload a File to Cloudinary via the signature API.
 * Used by both add.jsx and [id]/index.jsx to avoid duplicating the upload logic.
 */
export function useCloudinaryUpload() {
  const uploadFileToCloudinary = async (file, resourceType, folder) => {
    const sigRes = await fetch("/api/upload/signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource_type: resourceType, folder }),
    })
    if (!sigRes.ok) throw new Error("Failed to get upload signature")
    const sig = await sigRes.json()

    const fd = new FormData()
    fd.append("file", file)
    fd.append("timestamp", sig.timestamp)
    fd.append("signature", sig.signature)
    fd.append("api_key", sig.api_key)
    fd.append("folder", sig.folder)
    fd.append("upload_preset", sig.upload_preset)

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloud_name}/${resourceType}/upload`,
      { method: "POST", body: fd }
    )
    if (!uploadRes.ok) throw new Error("Cloudinary upload failed")
    const data = await uploadRes.json()
    if (data.error) throw new Error(data.error.message)
    return data.secure_url
  }

  return { uploadFileToCloudinary }
}
