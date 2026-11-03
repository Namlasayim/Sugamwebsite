import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const require = createRequire(import.meta.url)
const vitePrerender = require('vite-plugin-prerender')

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const staticRoutes = ['/', '/gallery', '/about', '/contact']

function getPrerenderRoutes() {
  const sitemapPath = path.join(projectRoot, 'public', 'sitemap.xml')
  if (!fs.existsSync(sitemapPath)) return staticRoutes

  const sitemap = fs.readFileSync(sitemapPath, 'utf8')
  const artworkRoutes = [...sitemap.matchAll(/<loc>https:\/\/sugamartz\.com(\/gallery\/[^<]+)<\/loc>/g)]
    .map((match) => match[1])
  return [...new Set([...staticRoutes, ...artworkRoutes])]
}

export default defineConfig(({ command }) => {
  const plugins = [react()]

  if (command === 'build') {
    plugins.push(vitePrerender({
      staticDir: path.join(projectRoot, 'dist'),
      routes: getPrerenderRoutes(),
      crawlLinks: false,
      renderer: new vitePrerender.PuppeteerRenderer({
        renderAfterDocumentEvent: 'prerender-ready',
        injectProperty: '__PRERENDER_INJECTED',
        inject: { enabled: true },
        maxConcurrentRoutes: 2,
        navigationOptions: { waitUntil: 'domcontentloaded', timeout: 45000 },
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }),
    }))
  }

  return {
    plugins,
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-router')) return 'react-vendor'
            if (id.includes('@supabase')) return 'supabase-vendor'
            if (id.includes('react-icons')) return 'icons-vendor'
          }
          return undefined
        },
      },
    },
  },
  }
})
