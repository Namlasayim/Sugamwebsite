import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { FaEnvelope, FaInstagram, FaTiktok, FaWhatsapp, FaYoutube } from 'react-icons/fa6'
import { useSiteContent } from '../../context/useSiteContent'
import '../../styles/About.css'
import '../../styles/SiteAtmosphere.css'
import '../../styles/VideoHero.css'

function Arrow() { return <span aria-hidden="true">↗</span> }

function Header() {
  const { settings } = useSiteContent()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'
  const whatsappUrl = settings.whatsapp_number ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}` : '/contact'

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [])

  return <header className="rang-header page-entrance page-entrance--header">
    {!isHome && <Link className="rang-logo home-return-button" to="/" aria-label="Back to homepage">Back home <span aria-hidden="true">↗</span></Link>}
    <nav id="main-navigation" className={menuOpen ? 'rang-nav is-open' : 'rang-nav'} aria-label="Main navigation">
      <NavLink to="/gallery" onClick={() => setMenuOpen(false)}>Gallery</NavLink>
      <NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink>
      <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
    </nav>
    <div className="header-right"><a className="header-contact" href={whatsappUrl} target="_blank" rel="noreferrer">Talk to the artist <Arrow /></a><button className="menu-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu" aria-expanded={menuOpen} aria-controls="main-navigation"><i /><i /><i /></button></div>
  </header>
}

function Footer() {
  const { settings } = useSiteContent()
  const whatsappUrl = settings.whatsapp_number ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}` : '/contact'
  const socialLinks = [
    ['Instagram', settings.instagram_url, FaInstagram],
    ['YouTube', settings.youtube_url, FaYoutube],
    ['TikTok', settings.tiktok_url, FaTiktok],
    ['WhatsApp', settings.whatsapp_number ? whatsappUrl : '', FaWhatsapp],
    ['Email', settings.contact_email ? `mailto:${settings.contact_email}` : '', FaEnvelope],
  ].filter(([, url]) => url)

  return <footer className="rang-footer home-footer"><div className="footer-top"><div className="footer-branding"><Link className="rang-logo" to="/">{settings.artist_name}<span>.</span></Link><div className="home-footer__feature"><p className="home-footer__label">THE STUDIO / 2026</p><p>Paintings made slowly, with memory in the light and Nepal in the ground.</p><Link to="/gallery" className="home-footer__link">Enter the collection <Arrow /></Link></div></div><div className="footer-links footer-socials" aria-label="Social and contact links">{socialLinks.map(([label, url, Icon]) => <a key={label} href={url} target={label === 'Email' ? undefined : '_blank'} rel={label === 'Email' ? undefined : 'noreferrer'} aria-label={label} title={label}><Icon aria-hidden="true" size={18} /><span className="sr-only">{label}</span></a>)}</div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {settings.artist_name}</span><Link to="/">Back to top ↑</Link></div></footer>
}

export function ScrollToTop() {
  const { pathname } = useLocation()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    const stayingWithinGallery = previousPathname.current.startsWith('/gallery') && pathname.startsWith('/gallery')
    if (!stayingWithinGallery) window.scrollTo(0, 0)
    previousPathname.current = pathname
  }, [pathname])
  return null
}

export default function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.documentElement.classList.add('js-enabled')

    const elements = document.querySelectorAll('.page-reveal')
    if (!elements.length) return undefined
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }), { threshold: 0.12 })
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [pathname])

  return <main className="rang-page"><Header /><Outlet /><Footer /></main>
}
