#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const forceMode = process.argv.includes('--force')

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

function getSupabaseConfig() {
  const envFromFile = parseEnvFile(path.join(projectRoot, '.env'))
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || envFromFile.SUPABASE_URL || envFromFile.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || envFromFile.SUPABASE_SERVICE_ROLE_KEY || envFromFile.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or provide VITE_* values in .env.')
  }

  if (supabaseKey.includes('sb_publishable_')) {
    throw new Error('The publishable Supabase key is not allowed for image uploads. Set SUPABASE_SERVICE_ROLE_KEY to a service-role secret before running this script.')
  }

  return { supabaseUrl, supabaseKey }
}

function isSignedSupabaseUrl(url) {
  return typeof url === 'string' && /\/storage\/v1\/object\/sign\/|[?&]token=|\/download\?/i.test(url)
}

function getBucketOriginAndName(sourceUrl) {
  if (!sourceUrl) return { bucket: 'paintings', origin: '' }

  try {
    const parsed = new URL(sourceUrl)
    const match = parsed.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)/i)
    return {
      bucket: match?.[1] || 'paintings',
      origin: parsed.origin,
    }
  } catch {
    return { bucket: 'paintings', origin: '' }
  }
}

function buildPublicRenditionUrl(sourceUrl, paintingId, variant) {
  if (!sourceUrl || !paintingId) return null
  const { bucket, origin } = getBucketOriginAndName(sourceUrl)
  if (!origin) return null
  return `${origin}/storage/v1/object/public/${bucket}/painting-renditions/${paintingId}/${variant}.jpg`
}

async function ensureFolderContents(client, bucket, folderPath) {
  const { data, error } = await client.storage.from(bucket).list(folderPath)
  if (error && !error.message?.includes('not found')) {
    throw error
  }
  return data || []
}

async function optimizeWithQuality(buffer, { width, targetBytes, initialQuality, minimumQuality }) {
  let quality = initialQuality
  let outputBuffer = await sharp(buffer)
    .rotate()
    .resize({ width, fit: 'inside', withoutEnlargement: true })
    .toColorspace('srgb')
    .jpeg({ quality, progressive: true, mozjpeg: true })
    .toBuffer()

  while (outputBuffer.length > targetBytes && quality > minimumQuality) {
    quality -= 5
    outputBuffer = await sharp(buffer)
      .rotate()
      .resize({ width, fit: 'inside', withoutEnlargement: true })
      .toColorspace('srgb')
      .jpeg({ quality, progressive: true, mozjpeg: true })
      .toBuffer()
  }

  return { buffer: outputBuffer, quality }
}

async function uploadRendition(client, bucket, objectPath, buffer, sourceUrl) {
  const headers = {
    'Cache-Control': 'public, max-age=31536000, immutable',
  }

  const { error } = await client.storage.from(bucket).upload(objectPath, buffer, {
    contentType: 'image/jpeg',
    upsert: true,
    cacheControl: '31536000',
    headers,
  })

  if (error) {
    throw new Error(`Upload failed for ${sourceUrl}: ${error.message}`)
  }
}

async function main() {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig()
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  const { data: paintings, error: paintingsError } = await client
    .from('paintings')
    .select('id, image_url')
    .not('image_url', 'is', null)
    .order('display_order', { ascending: true })

  if (paintingsError) throw paintingsError

  const rows = []

  for (const painting of paintings || []) {
    const sourceUrl = painting.image_url
    if (!sourceUrl) continue

    const { bucket } = getBucketOriginAndName(sourceUrl)
    const folderPath = `painting-renditions/${painting.id}`
    const folderContents = await ensureFolderContents(client, bucket, folderPath)
    const hasHero = folderContents.some((item) => item.name === 'hero.jpg')
    const hasThumb = folderContents.some((item) => item.name === 'thumb.jpg')

    if (!forceMode && hasHero && hasThumb) {
      console.log(`Skipping painting ${painting.id}: both renditions already exist`)
      continue
    }

    const response = await fetch(sourceUrl)
    if (!response.ok) {
      throw new Error(`Failed to download painting ${painting.id}: ${response.status} ${response.statusText}`)
    }

    const originalBuffer = Buffer.from(await response.arrayBuffer())
    const originalSize = originalBuffer.length

    if (isSignedSupabaseUrl(sourceUrl)) {
      console.warn(`Painting ${painting.id} uses a signed URL (${sourceUrl}). It can be replaced with public renditions after the source object is made public.`)
    }

    const heroResult = await optimizeWithQuality(originalBuffer, {
      width: 2000,
      targetBytes: 300 * 1024,
      initialQuality: 80,
      minimumQuality: 60,
    })

    const thumbResult = await optimizeWithQuality(originalBuffer, {
      width: 900,
      targetBytes: 80 * 1024,
      initialQuality: 78,
      minimumQuality: 60,
    })

    const heroPath = `${folderPath}/hero.jpg`
    const thumbPath = `${folderPath}/thumb.jpg`

    await uploadRendition(client, bucket, heroPath, heroResult.buffer, sourceUrl)
    await uploadRendition(client, bucket, thumbPath, thumbResult.buffer, sourceUrl)

    const publicHeroUrl = buildPublicRenditionUrl(sourceUrl, painting.id, 'hero') || `${getBucketOriginAndName(sourceUrl).origin}/storage/v1/object/public/${bucket}/painting-renditions/${painting.id}/hero.jpg`
    const publicThumbUrl = buildPublicRenditionUrl(sourceUrl, painting.id, 'thumb') || `${getBucketOriginAndName(sourceUrl).origin}/storage/v1/object/public/${bucket}/painting-renditions/${painting.id}/thumb.jpg`

    console.log(`Painting ${painting.id}: original=${originalSize} bytes | hero=${heroResult.buffer.length} bytes (${heroResult.quality} quality) | thumb=${thumbResult.buffer.length} bytes (${thumbResult.quality} quality) | hero=${publicHeroUrl} | thumb=${publicThumbUrl}`)
    rows.push({
      id: painting.id,
      originalSize: originalSize,
      heroSize: heroResult.buffer.length,
      thumbSize: thumbResult.buffer.length,
    })
  }

  console.log('\nFinal summary')
  console.table(rows)
}

main().catch((error) => {
  console.error('Image optimization failed:')
  console.error(error)
  process.exitCode = 1
})
