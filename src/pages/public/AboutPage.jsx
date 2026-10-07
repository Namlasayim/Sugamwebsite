import { useEffect } from 'react'
import { useSiteContent } from '../../context/useSiteContent'
import SEO from '../../components/SEO'
import '../../styles/AboutPage.css'

export default function AboutPage() {
  const { settings, loading } = useSiteContent()
  const socialLinks = [settings.instagram_url, settings.youtube_url, settings.tiktok_url].filter(Boolean)
  const jsonLd = [{
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: settings.artist_name || 'Sugam Tamang',
    jobTitle: 'Artist',
    nationality: 'Nepali',
    sameAs: socialLinks,
  }, {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SugamArtz',
    url: 'https://sugamartz.com/',
    description: 'Contemporary paintings and artist profile by Sugam Tamang.',
  }]

  useEffect(() => {
    if (loading) return undefined
    const elements = document.querySelectorAll('.reveal-on-scroll')
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }), { threshold: 0.12 })
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [loading])

  return <>
    <SEO
      title="About Sugam Tamang | Nepali Contemporary Artist | SugamArtz"
      description="Sugam Tamang is a Nepali contemporary artist exploring memory, landscape, and color through original paintings and slow, intentional work."
      canonical="/about"
      ogImage="/og-image.jpg"
      ogType="profile"
      ogImageAlt="Sugam Tamang portrait and artwork preview"
      ogTitle="About Sugam Tamang | Nepali Contemporary Artist | SugamArtz"
      ogDescription="Sugam Tamang is a Nepali contemporary artist exploring memory, landscape, and color through original paintings and slow, intentional work."
      jsonLd={jsonLd}
    />
    <section className="statement-section about-page reveal-on-scroll page-entrance page-entrance--content">
    <div className="about-page__body">
      <div className="about-page__portrait-wrap">
        <span className="about-page__portrait-label">PORTRAIT / 01</span>
        <div className="profile-photo">
          {settings.profile_photo_url ? <img src={settings.profile_photo_url} alt={`${settings.artist_name || 'Sugam Tamang'} portrait by the artist`} loading="lazy" decoding="async" width="800" height="1000" /> : <span>PROFILE PHOTO COMING SOON</span>}
        </div>
      </div>
      <div className="about-page__intro">
        <div>
          <p className="eyebrow">ABOUT THE ARTIST</p>
          <h1>{settings.artist_name}</h1>
        </div>
      </div>
      <div className="about-page__copy">
        <h2>Made with patience.<br /><em>Held in color.</em></h2>
        <p className="statement-copy">{settings.about_text}</p>
      </div>
    </div>
  </section>
  </>
}
  