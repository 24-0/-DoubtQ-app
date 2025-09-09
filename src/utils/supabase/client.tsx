import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './info'

// Create a singleton Supabase client
let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    )
  }
  return supabaseClient
}
