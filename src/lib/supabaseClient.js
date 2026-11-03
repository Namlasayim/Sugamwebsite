import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export function preconnectToSupabase() {
  if (!supabaseUrl || typeof document === 'undefined') return

  const origin = new URL(supabaseUrl).origin
  const alreadyConnected = Array.from(document.querySelectorAll('link[rel="preconnect"]'))
    .some((link) => new URL(link.href).origin === origin)
  if (alreadyConnected) return

  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = origin
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
