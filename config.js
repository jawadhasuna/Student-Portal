// ============================================================
// Supabase connection — EDIT THESE TWO VALUES
// ============================================================
// Find them in your Supabase dashboard:
//   Project Settings → API → "Project URL" and "anon public"
//
// The anon key is MEANT to be public — it ships in the page source
// of every client-side Supabase app. What keeps your data safe is
// Row Level Security, which schema.sql turns on. Never paste the
// `service_role` key here; that one bypasses RLS entirely.
// ============================================================

window.SUPABASE_CONFIG = {
  url: "YOUR_SUPABASE_PROJECT_URL",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
};
