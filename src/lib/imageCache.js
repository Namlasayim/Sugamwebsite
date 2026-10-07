const imagePromises = new Map()

function ensurePreconnect(url) {
  if (!url || typeof document === 'undefined') return

  try {
    const { origin } = new URL(url)
    if (document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) return

    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = origin
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  } catch {
    // Ignore invalid or non-URL image values.
  }
}

function ensureImagePreload(url, priority = 'low') {
  if (!url || typeof document === 'undefined') return

  const existing = document.querySelector(`link[rel="preload"][as="image"][href="${CSS.escape(url)}"]`)
  if (existing) return

  const preload = document.createElement('link')
  preload.rel = 'preload'
  preload.as = 'image'
  preload.href = url
  preload.fetchPriority = priority
  preload.decoding = 'async'
  document.head.appendChild(preload)
}

export function preloadImage(url, priority = 'low') {
  if (!url || imagePromises.has(url)) return imagePromises.get(url) || Promise.resolve()

  ensurePreconnect(url)
  ensureImagePreload(url, priority)

  const promise = new Promise((resolve) => {
    const image = new Image()
    image.onload = resolve
    image.onerror = resolve
    image.decoding = 'async'
    image.fetchPriority = priority
    image.src = url
  })

  imagePromises.set(url, promise)
  return promise
}

export function preloadImages(urls, priority = 'low') {
  return Promise.allSettled([...new Set(urls.filter(Boolean))].map(url => preloadImage(url, priority)))
}

export function clearImageCache() {
  imagePromises.clear()
}
