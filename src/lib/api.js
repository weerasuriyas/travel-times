import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || '/api'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

export async function apiGet(path) {
  const res = await fetch(`${API_URL}/${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function apiGetAuth(path) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/${path}`, { headers })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `API error: ${res.status}`)
  return json
}

export async function apiPost(path, data) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `API error: ${res.status}`)
  return json
}

export async function apiPut(path, data) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `API error: ${res.status}`)
  return json
}

export async function apiDelete(path) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/${path}`, {
    method: 'DELETE',
    headers,
  })
  return res.json()
}

export async function apiUploadImage(file, entityType, entityId, role = 'gallery', altText = '') {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')

  const fd = new FormData()
  fd.append('image', file)
  fd.append('entity_type', entityType)
  fd.append('entity_id', entityId || '')
  fd.append('role', role)
  fd.append('alt_text', altText)

  const res = await fetch(`${API_URL}/images`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.access_token}` },
    body: fd,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Upload failed')
  return json
}

export async function apiUploadStagingImage(file, stagingId, role = 'gallery', altText = '', sortOrder = 0) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')

  const fd = new FormData()
  fd.append('image', file)
  fd.append('staging_id', String(stagingId))
  fd.append('role', role)
  fd.append('alt_text', altText)
  fd.append('sort_order', String(sortOrder))

  const res = await fetch(`${API_URL}/staging-images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: fd,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Staging upload failed')
  return json
}
