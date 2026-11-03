import { useSiteContent } from '../../context/useSiteContent'
import Seo from '../../components/Seo'

function Arrow() { return <span aria-hidden="true">↗</span> }

export default function ContactPage() {
  const { settings, loading } = useSiteContent()
  const whatsappUrl = settings.whatsapp_number ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}` : '#'
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
    description: 'Contact and purchase enquiries for original paintings by Sugam Tamang.',
  }]

  return <>
    <Seo
      title="Buy Original Art & Enquiries | Sugam Tamang | SugamArtz"
      description="Contact Sugam Tamang to enquire about buying original artworks, commissions, and private sales of contemporary Nepali paintings."
      path="/contact"
      image="/og-image.jpg"
      ready={!loading}
      jsonLd={jsonLd}
    />
    <section className="contact-section page-entrance page-entrance--content"><p className="eyebrow">INQUIRIES</p><h1>Find a work<br /><em>to live with.</em></h1><a className="dark-button" href={whatsappUrl} target="_blank" rel="noreferrer">Message on WhatsApp <Arrow /></a></section>
  </>
}
