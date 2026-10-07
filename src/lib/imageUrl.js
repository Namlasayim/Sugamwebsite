const signedUrlPattern = /\/storage\/v1\/object\/sign\/|[?&]token=|\/download\?/i
const warnedSignedUrls = new Set()

function getFallbackOriginAndBucket(fallbackUrl) {
  if (!fallbackUrl) return null

  try {
    const parsedUrl = new URL(fallbackUrl)
    const match = parsedUrl.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)/i)
    if (!match) return null

    return {
      origin: parsedUrl.origin,
      bucket: match[1],
    }
  } catch {
    return null
  }
}

export function isSignedSupabaseUrl(url) {
  return typeof url === 'string' && signedUrlPattern.test(url)
}

export function paintingHero(id, fallbackUrl) {
  if (!id) return fallbackUrl || ''

  const target = getFallbackOriginAndBucket(fallbackUrl)
  if (!target) return fallbackUrl || ''

  return `${target.origin}/storage/v1/object/public/${target.bucket}/painting-renditions/${id}/hero.jpg`
}

export function paintingThumb(id, fallbackUrl) {
  if (!id) return fallbackUrl || ''

  const target = getFallbackOriginAndBucket(fallbackUrl)
  if (!target) return fallbackUrl || ''

  return `${target.origin}/storage/v1/object/public/${target.bucket}/painting-renditions/${id}/thumb.jpg`
}

export function handleImageFallback(event, fallbackUrl) {
  const target = event?.currentTarget
  if (!target || !fallbackUrl) return
  if (target.dataset.fallbackApplied === 'true') return

  if (isSignedSupabaseUrl(fallbackUrl)) {
    if (!warnedSignedUrls.has(fallbackUrl)) {
      warnedSignedUrls.add(fallbackUrl)
      console.warn(`Signed URL fallback used for painting image: ${fallbackUrl}. Replace with a public rendering or move the image to a public bucket.`)
    }
  }

  target.dataset.fallbackApplied = 'true'
  target.src = fallbackUrl
}
