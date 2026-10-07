import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return <section className="gallery-section reveal-on-scroll page-entrance"><div className="section-heading" style={{ justifyContent: 'center', textAlign: 'center', marginBottom: '32px' }}><div><p className="eyebrow">404</p><h1>Page not found.</h1></div></div><div className="content-state" style={{ borderTop: '1px solid var(--line)', minHeight: '120px', flexDirection: 'column' }}><p style={{ maxWidth: '420px', color: 'var(--muted)', lineHeight: 1.7 }}>The page you requested could not be found. It may have moved, been removed, or never existed.</p><Link className="outline-link" to="/gallery" style={{ marginTop: '18px' }}>Back to gallery <span>↗</span></Link></div></section>
}
