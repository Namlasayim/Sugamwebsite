async function requireSupabase() {
  const { supabase } = await import('./supabaseClient')
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  return supabase
}

function createUploadId() {
  const browserCrypto = globalThis.crypto
  if (browserCrypto?.randomUUID) return browserCrypto.randomUUID()
  if (browserCrypto?.getRandomValues) {
    const values = new Uint32Array(4)
    browserCrypto.getRandomValues(values)
    return Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('-')
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export async function getCurrentSession() {
  const client = await requireSupabase()
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  return data.session
}

export async function fetchSiteContent() {
  const client = await requireSupabase()
  const [{ data: settings, error: settingsError }, { data: artistIntro, error: introError }, { data: paintings, error: paintingsError }] = await Promise.all([
    client.from('settings').select('*').eq('id', 1).maybeSingle(),
    client.from('artist_intro').select('*').eq('id', 1).maybeSingle(),
    client.from('paintings').select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false }),
  ])
  if (settingsError) throw settingsError
  if (introError) throw introError
  if (paintingsError) throw paintingsError
  return { settings, artistIntro, paintings: paintings || [] }
}

export async function saveSettings(values) {
  const client = await requireSupabase()
  const { error } = await client.from('settings').upsert({ id: 1, ...values }, { onConflict: 'id' })
  if (error) throw error
}

export async function saveArtistIntro(values) {
  const client = await requireSupabase()
  const { error } = await client.from('artist_intro').upsert({ id: 1, ...values }, { onConflict: 'id' })
  if (error) throw error
}

export async function uploadPaintingImage(file) {
  const client = await requireSupabase()
  const path = `${createUploadId()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`
  const { error } = await client.storage.from('paintings').upload(path, file, { upsert: false })
  if (error) throw error
  return { path, url: client.storage.from('paintings').getPublicUrl(path).data.publicUrl }
}

export async function uploadWebsiteIcon(file) {
  const client = await requireSupabase()
  const path = `site-icons/${createUploadId()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`
  const { error } = await client.storage.from('site-assets').upload(path, file, { upsert: false })
  if (error) throw error
  return client.storage.from('site-assets').getPublicUrl(path).data.publicUrl
}

export async function savePainting(values, imageFile, currentImageUrl) {
  const client = await requireSupabase()
  let imageUrl = currentImageUrl || null
  let imagePath = null
  if (imageFile) ({ url: imageUrl, path: imagePath } = await uploadPaintingImage(imageFile))
  const payload = { ...values, price: values.price === '' ? null : Number(values.price), image_url: imageUrl }
  const request = values.id ? client.from('paintings').update(payload).eq('id', values.id) : client.from('paintings').insert(payload)
  const { error } = await request
  if (error) {
    if (imagePath) await client.storage.from('paintings').remove([imagePath])
    throw error
  }
}

export async function deletePainting(painting) {
  const client = await requireSupabase()
  const { error } = await client.from('paintings').delete().eq('id', painting.id)
  if (error) throw error
  if (painting.image_url) {
    const path = painting.image_url.split('/storage/v1/object/public/paintings/')[1]
    if (path) await client.storage.from('paintings').remove([decodeURIComponent(path)])
  }
}

export async function signIn(email, password) {
  const client = await requireSupabase()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  const client = await requireSupabase()
  await client.auth.signOut()
}
