import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(projectRoot, 'dist')
const staticPages = [
  { route: '/', title: 'Sugam Tamang | Contemporary Nepali Artist – Original Paintings | SugamArtz' },
  { route: '/gallery', title: 'Original Paintings by Sugam Tamang | Nepali Art for Sale | SugamArtz' },
  { route: '/about', title: 'About Sugam Tamang — Contemporary Nepali Artist | SugamArtz' },
  { route: '/contact', title: 'Buy Original Art & Enquiries | Sugam Tamang | SugamArtz' },
]

function decodeHtml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

function getTag(html, name, value) {
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const tag = html.match(new RegExp(`<${name}\\b(?=[^>]*\\b(?:name|property|rel)="${escapedValue}")[^>]*>`, 'i'))?.[0]
  if (!tag) return null
  const content = tag.match(/\b(?:content|href)="([^"]*)"/i)?.[1]
  return content ? decodeHtml(content) : null
}

function readPrerenderedPage(route) {
  const relativePath = route === '/' ? 'index.html' : path.join(route.slice(1), 'index.html')
  const filePath = path.join(distDir, relativePath)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing prerendered HTML for "${route}" at ${filePath}`)
  }

  const html = fs.readFileSync(filePath, 'utf8')
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  if (!title) throw new Error(`Missing title in prerendered HTML for "${route}"`)
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
  if (!h1) throw new Error(`Missing H1 in prerendered HTML for "${route}"`)
  const renderedBody = html.match(/<div id="root">([\s\S]*?)<\/body>/i)?.[1] || ''
  const visibleText = decodeHtml(renderedBody
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
  if (!visibleText || visibleText.length < 20) {
    throw new Error(`Missing rendered body text in prerendered HTML for "${route}"`)
  }
  if (/class="[^"]*(?:skeleton|spinner)[^"]*"/i.test(renderedBody)) {
    throw new Error(`Loading placeholder remains in prerendered HTML for "${route}"`)
  }
  if (/loading="lazy"|data-src=/i.test(renderedBody)) {
    throw new Error(`Lazy image placeholder remains in prerendered HTML for "${route}"`)
  }
  const metadata = {
    title: decodeHtml(title),
    h1: decodeHtml(h1.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(),
    visibleText,
    description: getTag(html, 'meta', 'description'),
    canonical: getTag(html, 'link', 'canonical'),
    ogTitle: getTag(html, 'meta', 'og:title'),
    ogDescription: getTag(html, 'meta', 'og:description'),
    ogUrl: getTag(html, 'meta', 'og:url'),
    ogImage: getTag(html, 'meta', 'og:image'),
    ogType: getTag(html, 'meta', 'og:type'),
    twitterCard: getTag(html, 'meta', 'twitter:card'),
  }
  for (const [name, value] of Object.entries(metadata)) {
    if (!value) throw new Error(`Missing ${name} metadata in prerendered HTML for "${route}"`)
  }
  if (metadata.canonical !== `https://sugamartz.com${route}`) {
    throw new Error(`Unexpected canonical URL for "${route}": ${metadata.canonical}`)
  }
  if (metadata.ogTitle !== metadata.title || metadata.ogUrl !== metadata.canonical) {
    throw new Error(`Open Graph metadata does not match the page title and URL for "${route}"`)
  }
  if (metadata.twitterCard !== 'summary_large_image') {
    throw new Error(`Missing large-image Twitter card in prerendered HTML for "${route}"`)
  }

  return metadata
}

for (const page of staticPages) {
  const metadata = readPrerenderedPage(page.route)
  if (metadata.title !== page.title) {
    throw new Error(`Unexpected prerendered title for "${page.route}": ${metadata.title}`)
  }
}

const sitemapPath = path.join(projectRoot, 'public', 'sitemap.xml')
const sitemap = fs.readFileSync(sitemapPath, 'utf8')
const artworkRoutes = [...sitemap.matchAll(/<loc>https:\/\/sugamartz\.com(\/gallery\/[^<]+)<\/loc>/g)]
  .map((match) => match[1])

for (const route of artworkRoutes) {
  const metadata = readPrerenderedPage(route)
  if (!metadata.title.includes('by Sugam Tamang | Original') || metadata.ogType !== 'article') {
    throw new Error(`Artwork route "${route}" does not have artwork-specific SEO metadata: ${metadata.title}`)
  }
  if (!metadata.h1) throw new Error(`Artwork route "${route}" is missing its artwork heading`)
}

for (const route of ['/', '/gallery', '/about', ...artworkRoutes]) {
  const relativePath = route === '/' ? 'index.html' : path.join(route.slice(1), 'index.html')
  const html = fs.readFileSync(path.join(distDir, relativePath), 'utf8')
  if (!/<img\b[^>]*\bsrc=/i.test(html)) {
    throw new Error(`Missing rendered image tags in prerendered HTML for "${route}"`)
  }
}

console.log(`Verified prerendered content and SEO for ${staticPages.length} pages and ${artworkRoutes.length} artwork routes.`)
