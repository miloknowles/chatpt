import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import ws from "ws"

import { getEnv } from "./env.js"

export interface AuthContext {
  supabase: SupabaseClient
  userId: string
}

export async function getAuthContext(accessToken: string): Promise<AuthContext> {
  const { supabaseUrl, supabasePublishableKey } = getEnv()

  const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    realtime: {
      transport: ws,
    },
  })

  const { data, error } = await supabase.auth.getUser(accessToken)

  if (error || !data.user) {
    throw new Error(error?.message ?? "Unauthorized. Missing or invalid Supabase access token.")
  }

  return {
    supabase,
    userId: data.user.id,
  }
}
