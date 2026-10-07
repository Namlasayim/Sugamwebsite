#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const publicDir = path.join(projectRoot, 'public')
const outputPath = path.join(publicDir, 'og-image.jpg')

function parseArgs() {
  return process.argv.slice(2).reduce((acc, arg) => {
    if (!arg.startsWith('--')) return acc
    const [key, value = true] = arg.split('=')
    acc[key.slice(2)] = value
    return acc
  }, {})
}

function resolveFont(candidates) {
  const fallback = []
  for (const candidate of candidates) {
    if (candidate.includes('.')) {
      const candidatePath = path.isAbsolute(candidate) ? candidate : path.join('/usr/share/fonts', candidate)
      if (fs.existsSync(candidatePath)) {
        return candidatePath
      }
    }
    fallback.push(candidate)
  }

  for (const candidate of fallback) {
    try {
      const output = execSync(`fc-match --format='%{file}\n' '${candidate.replace(/'/g, "'\\''")}'`, { encoding: 'utf8' }).trim()
      if (output) return output
    } catch {
      // noop: fall through to the next candidate
    }
  }

  throw new Error('No matching local font was found for the OG image. The site stack uses Georgia/Noto Serif; install the appropriate font and retry.')
}

async function main() {
  const args = parseArgs()
  const sourcePath = args.source ? path.resolve(projectRoot, args.source) : null

  if (!sourcePath || !fs.existsSync(sourcePath)) {
    throw new Error('Provide a source image using --source=/path/to/painting.jpg for the OG image build.')
  }

  const titleFont = await resolveFont(['Georgia', 'Noto Serif', 'Liberation Serif'])
  const bodyFont = await resolveFont(['DejaVu Sans', 'Noto Sans', 'Arial'])

  const bgBase = await sharp(sourcePath)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .modulate({ brightness: 0.78, saturation: 0.9 })
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toBuffer()

  const gradientSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#29221d" stop-opacity="0.88" />
          <stop offset="42%" stop-color="#29221d" stop-opacity="0.72" />
          <stop offset="100%" stop-color="#29221d" stop-opacity="0.16" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
    </svg>
  `

  const textSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <filter id="s" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="18" flood-color="#000000" flood-opacity="0.18"/>
        </filter>
      </defs>
      <text x="116" y="286" fill="#f4eee2" font-size="74" font-weight="400" letter-spacing="-1.8" font-family="${titleFont}, Georgia, serif" filter="url(#s)">Sugam Tamang</text>
      <text x="118" y="346" fill="#f3e7d8" opacity="0.92" font-size="28" letter-spacing="3" font-family="${bodyFont}, DejaVu Sans, sans-serif">CONTEMPORARY NEPALI ARTIST</text>
      <text x="118" y="536" fill="#f4eee2" opacity="0.9" font-size="22" letter-spacing="1.7" font-family="${bodyFont}, DejaVu Sans, sans-serif">sugamartz.com</text>
    </svg>
  `

  await sharp(bgBase)
    .composite([
      { input: await sharp(Buffer.from(gradientSvg)).png().toBuffer(), left: 0, top: 0, blend: 'over' },
      { input: await sharp(Buffer.from(textSvg)).png().toBuffer(), left: 0, top: 0, blend: 'over' },
    ])
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toFile(outputPath)

  const metadata = await sharp(outputPath).metadata()
  if (metadata.width !== 1200 || metadata.height !== 630) {
    throw new Error(`OG image size is ${metadata.width}x${metadata.height}, expected 1200x630.`)
  }

  const { size } = fs.statSync(outputPath)
  if (size > 300 * 1024) {
    throw new Error(`OG image is ${size} bytes; target is under 300 KB.`)
  }

  console.log(`Built ${outputPath} (${metadata.width}x${metadata.height}) at ${size} bytes`)
}

main().catch((error) => {
  console.error('Failed to build social OG image.')
  console.error(error)
  process.exitCode = 1
})
