import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout, { ScrollToTop } from './pages/public/Layout'
import { SiteContentProvider } from './context/SiteContentContext'
import Admin from './pages/admin/Admin'

const Home = lazy(() => import('./pages/public/Home'))
const AboutPage = lazy(() => import('./pages/public/AboutPage'))
const GalleryPage = lazy(() => import('./pages/public/GalleryPage'))
const ContactPage = lazy(() => import('./pages/public/ContactPage'))
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'))

function RouteFallback() {
  return <div className="content-state" aria-live="polite"><span className="spinner" /> Loading...</div>
}

export default function App() {
  return <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ScrollToTop />
    <SiteContentProvider>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/gallery/:slug?" element={<GalleryPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </SiteContentProvider>
  </BrowserRouter>
}
