import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://oavkhnjigdqacvqfkzpf.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_M_ZCTbtu0UYlfiAyLON_2Q_jYWHAiPI";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Konfigurasi Supabase tidak ditemukan. Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY diset di .env");
}

// Resilient custom fetch wrapper with timeout
const customFetch: typeof fetch = (input, init) => {
  // If no abort signal provided, attach a sensible 8-second timeout
  // so requests don't hang indefinitely when Supabase sleeps or network is bad
  if (!init?.signal && typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    try {
      return fetch(input, { ...init, signal: AbortSignal.timeout(8000) });
    } catch {
      // Fallback if AbortSignal.timeout fails
    }
  }
  return fetch(input, init);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: customFetch
  }
});
