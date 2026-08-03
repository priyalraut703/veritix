import { createClient } from '@supabase/supabase-js'

// VITE_SUPABASE_ANON_KEY is your "Publishable key" from Supabase — it's
// meant to be public and shipped in frontend code. Never put the secret
// key or service_role key here; those stay in the Edge Function only.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type EventRow = {
  id: number
  organizer_address: string
  name: string
  description: string | null
  venue: string | null
  event_date: string | null
  face_price_stroops: number
  max_resale_bps: number
  cover_image_url: string | null
}