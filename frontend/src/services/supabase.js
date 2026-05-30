import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is configured with real values
const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key'
)

// Create client only if configured, otherwise null for graceful degradation
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const hasSupabase = isConfigured
