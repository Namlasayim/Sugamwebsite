import { useSiteContent } from '../../context/useSiteContent'
import SEO from '../../components/SEO'

function Arrow() { return <span aria-hidden="true">↗</span> }

export default function ContactPage() {
  const { settings } = useSiteContent()
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
    <SEO
      title="Contact & Enquiries – Buy Original Art by Sugam Tamang | SugamArtz"
      description="Contact Sugam Tamang to enquire about buying original artworks, commissions, and private sales of contemporary Nepali paintings."
      canonical="/contact"
      ogImage="/og-image.jpg"
      ogType="website"
      ogImageAlt="Contact Sugam Tamang for original art enquiries"
      ogTitle="Contact & Enquiries – Buy Original Art by Sugam Tamang | SugamArtz"
      ogDescription="Contact Sugam Tamang to enquire about buying original artworks, commissions, and private sales of contemporary Nepali paintings."
      jsonLd={jsonLd}
    />
    <section className="contact-section page-entrance page-entrance--content"><p className="eyebrow">INQUIRIES</p><h2>Find a work<br /><em>to live with.</em></h2><a className="dark-button" href={whatsappUrl} target="_blank" rel="noreferrer">Message on WhatsApp <Arrow /></a></section>
  </>
}
