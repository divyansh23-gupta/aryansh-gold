import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const isPlaceholder = !supabaseUrl || !supabaseAnonKey;

if (isPlaceholder) {
  console.warn(
    "Supabase Auth Warning: You are using placeholder environment variables in your .env file. Please update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your actual Supabase project keys."
  );
}

// Fallback to empty string if not defined, to prevent initialization crash
export const supabase = createClient(
  isPlaceholder ? "https://placeholder-url.supabase.co" : supabaseUrl,
  isPlaceholder ? "placeholder-key" : supabaseAnonKey
);
