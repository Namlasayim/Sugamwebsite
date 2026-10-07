import { useEffect } from 'react'

const DEFAULT_OG_IMAGE = 'https://sugamartz.com/og-image.jpg'

export default function SEO({
  title = 'Sugam Tamang',
  description = 'Original paintings by Sugam Tamang.',
  canonical = '/',
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  ogImageAlt = 'Sugam Tamang contemporary paintings',
  ogTitle = title,
  ogDescription = description,
  jsonLd,
}) {
  useEffect(() => {
    const canonicalUrl = canonical.startsWith('http') ? canonical : `${window.location.origin}${canonical}`

    document.title = title

    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta')
    metaDescription.name = 'description'
    metaDescription.content = description
    if (!metaDescription.parentNode) document.head.appendChild(metaDescription)

    const metaCanonical = document.querySelector('link[rel="canonical"]') || document.createElement('link')
    metaCanonical.setAttribute('rel', 'canonical')
    metaCanonical.setAttribute('href', canonicalUrl)
    if (!metaCanonical.parentNode) document.head.appendChild(metaCanonical)

    const ogUrlMeta = document.querySelector('meta[property="og:url"]') || document.createElement('meta')
    ogUrlMeta.setAttribute('property', 'og:url')
    ogUrlMeta.setAttribute('content', canonicalUrl)
    if (!ogUrlMeta.parentNode) document.head.appendChild(ogUrlMeta)

    const ogTitleMeta = document.querySelector('meta[property="og:title"]') || document.createElement('meta')
    ogTitleMeta.setAttribute('property', 'og:title')
    ogTitleMeta.setAttribute('content', ogTitle)
    if (!ogTitleMeta.parentNode) document.head.appendChild(ogTitleMeta)

    const ogDescriptionMeta = document.querySelector('meta[property="og:description"]') || document.createElement('meta')
    ogDescriptionMeta.setAttribute('property', 'og:description')
    ogDescriptionMeta.setAttribute('content', ogDescription)
    if (!ogDescriptionMeta.parentNode) document.head.appendChild(ogDescriptionMeta)

    const ogTypeMeta = document.querySelector('meta[property="og:type"]') || document.createElement('meta')
    ogTypeMeta.setAttribute('property', 'og:type')
    ogTypeMeta.setAttribute('content', ogType)
    if (!ogTypeMeta.parentNode) document.head.appendChild(ogTypeMeta)

    const ogImageMeta = document.querySelector('meta[property="og:image"]') || document.createElement('meta')
    ogImageMeta.setAttribute('property', 'og:image')
    ogImageMeta.setAttribute('content', ogImage)
    if (!ogImageMeta.parentNode) document.head.appendChild(ogImageMeta)

    const ogImageWidth = document.querySelector('meta[property="og:image:width"]') || document.createElement('meta')
    ogImageWidth.setAttribute('property', 'og:image:width')
    ogImageWidth.setAttribute('content', '1200')
    if (!ogImageWidth.parentNode) document.head.appendChild(ogImageWidth)

    const ogImageHeight = document.querySelector('meta[property="og:image:height"]') || document.createElement('meta')
    ogImageHeight.setAttribute('property', 'og:image:height')
    ogImageHeight.setAttribute('content', '630')
    if (!ogImageHeight.parentNode) document.head.appendChild(ogImageHeight)

    const ogImageAltMeta = document.querySelector('meta[property="og:image:alt"]') || document.createElement('meta')
    ogImageAltMeta.setAttribute('property', 'og:image:alt')
    ogImageAltMeta.setAttribute('content', ogImageAlt)
    if (!ogImageAltMeta.parentNode) document.head.appendChild(ogImageAltMeta)

    const twitterCard = document.querySelector('meta[name="twitter:card"]') || document.createElement('meta')
    twitterCard.setAttribute('name', 'twitter:card')
    twitterCard.setAttribute('content', 'summary_large_image')
    if (!twitterCard.parentNode) document.head.appendChild(twitterCard)

    const twitterTitle = document.querySelector('meta[name="twitter:title"]') || document.createElement('meta')
    twitterTitle.setAttribute('name', 'twitter:title')
    twitterTitle.setAttribute('content', ogTitle)
    if (!twitterTitle.parentNode) document.head.appendChild(twitterTitle)

    const twitterDescription = document.querySelector('meta[name="twitter:description"]') || document.createElement('meta')
    twitterDescription.setAttribute('name', 'twitter:description')
    twitterDescription.setAttribute('content', ogDescription)
    if (!twitterDescription.parentNode) document.head.appendChild(twitterDescription)

    const twitterImage = document.querySelector('meta[name="twitter:image"]') || document.createElement('meta')
    twitterImage.setAttribute('name', 'twitter:image')
    twitterImage.setAttribute('content', ogImage)
    if (!twitterImage.parentNode) document.head.appendChild(twitterImage)

    if (jsonLd) {
      let scriptTag = document.querySelector('script[data-seo-jsonld]')
      if (!scriptTag) {
        scriptTag = document.createElement('script')
        scriptTag.setAttribute('data-seo-jsonld', 'true')
        scriptTag.type = 'application/ld+json'
        document.head.appendChild(scriptTag)
      }
      scriptTag.textContent = JSON.stringify(jsonLd)
    }
  }, [title, description, canonical, ogImage, ogImageAlt, ogType, ogTitle, ogDescription, jsonLd])

  return null
}
