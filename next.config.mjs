/** @type {import('next').NextConfig} */

// Supabase Storage serves uploaded media from `<project-ref>.supabase.co`.
// Deriving the pattern from the env var keeps this working across projects
// (local, staging, production) without editing config per environment.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

/*
  Server Actions carry a CSRF check. When `x-forwarded-host` differs from the
  request's `Origin`, Next aborts the action unless the *origin* appears in
  `experimental.serverActions.allowedOrigins`.

  Behind a development port-forward that fires on every admin form. In a
  GitHub Codespace opened through the VS Code forwarder, the browser is on
  `localhost:3000` while the Codespaces proxy rewrites `x-forwarded-host` to
  `<name>-3000.app.github.dev`, so every save dies with "Invalid Server
  Actions request".

  Two things worth knowing about the matcher, both of which make the obvious
  configuration wrong (see `next/dist/server/app-render/csrf-protection.js`):

    * it is the ORIGIN that is matched, not the forwarded host — listing
      `*.app.github.dev` does nothing for the case above, because the origin
      is `localhost:3000`;
    * the value compared is `new URL(origin).host`, so it INCLUDES the port,
      and the wildcard matcher splits on "." only. `localhost:*` cannot
      match anything, which is why the ports below are enumerated.

  Origins are allowed from two places:

    * `SERVER_ACTIONS_ALLOWED_ORIGINS` — comma-separated, honoured in every
      environment. This is the one to use in production if the app genuinely
      sits behind a proxy on a different hostname.

    * the development defaults below, so a Codespace or a tunnel works
      without configuration.

  The defaults are gated on NODE_ENV: `allowedOrigins` is a security control,
  and loopback or somebody else's tunnel domain has no business being trusted
  in production.
*/
const configuredOrigins = (process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

/** The port `next dev` was actually started on, if we can tell. */
function devPort() {
  const flag = process.argv.findIndex((arg) => arg === "-p" || arg === "--port");
  if (flag !== -1 && process.argv[flag + 1]) return process.argv[flag + 1];
  return process.env.PORT || undefined;
}

const LOOPBACK_PORTS = [...new Set([devPort(), "3000", "3001", "3002", "8080"].filter(Boolean))];

const DEV_ORIGINS = [
  // The browser is on a forwarded loopback address while the proxy rewrites
  // the host — the Codespaces / VS Code port-forward case.
  ...["localhost", "127.0.0.1"].flatMap((host) =>
    LOOPBACK_PORTS.map((port) => `${host}:${port}`),
  ),
  // The browser is on the tunnel URL itself. No port, so a wildcard works.
  "*.app.github.dev",
  "*.github.dev",
  "*.gitpod.io",
  "*.ngrok-free.app",
  "*.ngrok.io",
  "*.trycloudflare.com",
  "*.loca.lt",
];

const allowedOrigins = [
  ...configuredOrigins,
  ...(process.env.NODE_ENV === "development" ? DEV_ORIGINS : []),
];

const nextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
    formats: ["image/avif", "image/webp"],
  },
  ...(allowedOrigins.length > 0
    ? { experimental: { serverActions: { allowedOrigins } } }
    : {}),
};

export default nextConfig;
