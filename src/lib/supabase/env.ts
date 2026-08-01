/**
 * Env access is centralised so a missing variable fails with a message that
 * says what to do, rather than a confusing "supabaseUrl is required" from
 * deep inside the client library.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill in your ` +
        `Supabase project values (see README.md → Setup).`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabaseAnonKey(): string {
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function supabaseServiceKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** True when the app has enough configuration to talk to Supabase at all. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
