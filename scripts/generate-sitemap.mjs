#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const publicDir = path.join(projectRoot, 'public')
const today = new Date().toISOString().slice(0, 10)

function parseEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    return content
      .split(/\r?\n/)
      .reduce((values, line) => {
        if (!line || line.trim().startsWith('#')) return values
        const delimiterIndex = line.indexOf('=')
        if (delimiterIndex === -1) return values
        const key = line.slice(0, delimiterIndex).trim()
        const value = line.slice(delimiterIndex + 1).trim().replace(/^['"]|['"]$/g, '')
        values[key] = value
        return values
      }, {})
  } catch {
    return {}
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  const env = parseEnvFile(path.join(projectRoot, '.env'))
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || env.SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY

  const urls = [
    { loc: 'https://sugamartz.com/', priority: '1.0', changefreq: 'weekly' },
    { loc: 'https://sugamartz.com/gallery', priority: '0.9', changefreq: 'weekly' },
    { loc: 'https://sugamartz.com/about', priority: '0.7', changefreq: 'monthly' },
    { loc: 'https://sugamartz.com/contact', priority: '0.6', changefreq: 'monthly' },
  ]

  if (supabaseUrl && supabaseKey) {
    try {
      const client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
      const { data: paintings, error } = await client.from('paintings').select('id, title').order('display_order', { ascending: true })

      if (error) {
        throw error
      }

      for (const painting of paintings || []) {
        const slug = slugify(painting.title)
        if (slug) urls.push({ loc: `https://sugamartz.com/gallery/${slug}`, priority: '0.8', changefreq: 'monthly' })
      }
    } catch (error) {
      console.warn('Sitemap extension skipped because the Supabase table could not be queried:', error.message || error)
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`)
  .join('\n')}
</urlset>
`

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8')
  console.log(`Wrote ${urls.length} sitemap entries to ${path.join(publicDir, 'sitemap.xml')}`)
}

main().catch((error) => {
  console.error('Failed to generate sitemap.')
  console.error(error)
  process.exitCode = 1
})
