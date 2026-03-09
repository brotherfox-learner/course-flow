export async function getCroppedImage(imageSrc, cropPixels) {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
  
    canvas.width = cropPixels.width
    canvas.height = cropPixels.height
  
    ctx.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      cropPixels.width,
      cropPixels.height
    )
  
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, "image/jpeg", 0.9)
    })
  }
  
  function createImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = url
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = reject
    })
  }