import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './info'

// Create a singleton Supabase client
let supabaseClient = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    )
  }
  return supabaseClient
}