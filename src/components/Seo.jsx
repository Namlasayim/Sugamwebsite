import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'

const SITE_ORIGIN = 'https://sugamartz.com'
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og-image.jpg`

function absoluteUrl(value, fallback = SITE_ORIGIN) {
  try {
    return new URL(value || fallback, SITE_ORIGIN).href
  } catch {
    return fallback
  }
}

export default function Seo({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  ready = true,
  jsonLd,
}) {
  const url = absoluteUrl(path)
  const imageUrl = absoluteUrl(image, DEFAULT_IMAGE)

  useEffect(() => {
    if (!ready || !window.__PRERENDER_INJECTED) return undefined
    const frame = window.requestAnimationFrame(() => {
      document.dispatchEvent(new Event('prerender-ready'))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [ready])

  return <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={url} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={url} />
    <meta property="og:image" content={imageUrl} />
    <meta property="og:type" content={type} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={imageUrl} />
    {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
  </Helmet>
}
