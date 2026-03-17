import Cropper from "react-easy-crop"

export default function AvatarCrop({
  imageUrl,
  crop,
  zoom,
  setCrop,
  setZoom,
  onCropComplete,
}) {
  if (!imageUrl) return null

  return (
    <div className="relative w-full h-full bg-black">
      <Cropper
        image={imageUrl}
        crop={crop}
        zoom={zoom}
        aspect={1}
        cropShape="rect"
        showGrid={false}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={onCropComplete}
      />
    </div>
  )
}