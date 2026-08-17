#!/usr/bin/env bash
#
# Misty Meadows Resorts — deploy.
#
#   ./deploy.sh                          asks for a domain
#   ./deploy.sh --domain example.com --email you@example.com
#   ./deploy.sh --local                  skips the prompt, runs locally
#   ./deploy.sh --dry-run                report the mode, change nothing
#
# Leave the domain blank and the site runs locally on http://localhost:PORT.
# Give a domain and it is published behind nginx with a Let's Encrypt
# certificate from certbot, renewing automatically.
#
set -euo pipefail

APP_NAME="misty-meadows"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-3000}"
DOMAIN=""
EMAIL="${CERTBOT_EMAIL:-}"
ASSUME_LOCAL=false
STAGING=false
DRY_RUN=false

# ---------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------

if [ -t 1 ]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'
  YELLOW=$'\033[33m'; RESET=$'\033[0m'
else
  BOLD=""; DIM=""; RED=""; GREEN=""; YELLOW=""; RESET=""
fi

step() { printf '\n%s==>%s %s%s%s\n' "$GREEN" "$RESET" "$BOLD" "$1" "$RESET"; }
info() { printf '    %s\n' "$1"; }
warn() { printf '%s !  %s%s\n' "$YELLOW" "$1" "$RESET"; }
die()  { printf '%s !! %s%s\n' "$RED" "$1" "$RESET" >&2; exit 1; }

# ---------------------------------------------------------------------
# Arguments
# ---------------------------------------------------------------------

while [ $# -gt 0 ]; do
  case "$1" in
    --domain) DOMAIN="${2:-}"; shift 2 ;;
    --domain=*) DOMAIN="${1#*=}"; shift ;;
    --email) EMAIL="${2:-}"; shift 2 ;;
    --email=*) EMAIL="${1#*=}"; shift ;;
    --port) PORT="${2:-}"; shift 2 ;;
    --port=*) PORT="${1#*=}"; shift ;;
    --local) ASSUME_LOCAL=true; shift ;;
    # Let's Encrypt rate-limits real certificates; use this while testing.
    --staging) STAGING=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "Unknown option: $1  (try --help)" ;;
  esac
done

cd "$APP_DIR"

# ---------------------------------------------------------------------
# Ask for the domain
# ---------------------------------------------------------------------

if [ "$ASSUME_LOCAL" = false ] && [ -z "$DOMAIN" ]; then
  if [ -t 0 ]; then
    printf '\n%sWhich domain should this be published on?%s\n' "$BOLD" "$RESET"
    printf '%sLeave blank to just run it locally on this machine.%s\n' "$DIM" "$RESET"
    printf 'Domain (e.g. mistymeadowsresorts.com): '
    read -r DOMAIN || DOMAIN=""
    DOMAIN="$(printf '%s' "$DOMAIN" | tr -d '[:space:]')"
  else
    # Non-interactive with no --domain: local is the safe default, since the
    # alternative would be requesting a certificate nobody asked for.
    info "No domain given and no terminal to ask on — running locally."
  fi
fi

# Accept a pasted URL and reduce it to the hostname.
if [ -n "$DOMAIN" ]; then
  DOMAIN="${DOMAIN#http://}"
  DOMAIN="${DOMAIN#https://}"
  DOMAIN="${DOMAIN%%/*}"
  DOMAIN="${DOMAIN%%:*}"
  DOMAIN="$(printf '%s' "$DOMAIN" | tr '[:upper:]' '[:lower:]')"
  # Normalise to the apex; www is added later as an extra certificate name,
  # so keeping it here would ask for www.www.example.com.
  DOMAIN="${DOMAIN#www.}"

  if ! printf '%s' "$DOMAIN" | grep -qE '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'; then
    die "\"$DOMAIN\" does not look like a domain name."
  fi
fi

if [ "$DRY_RUN" = true ]; then
  if [ -z "$DOMAIN" ]; then
    step "Dry run: LOCAL mode"
    info "Would build, then serve http://localhost:${PORT}"
    info "No nginx, no systemd unit, no certificate requested."
  else
    step "Dry run: PUBLISHED mode"
    info "Domain:      ${DOMAIN}"
    info "Would proxy: ${DOMAIN} -> 127.0.0.1:${PORT} via nginx"
    info "Would run:   certbot --nginx -d ${DOMAIN} --redirect"
    info "Service:     ${APP_NAME}.service"
  fi
  exit 0
fi

# ---------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------

step "Checking prerequisites"

command -v node >/dev/null || die "Node.js is not installed."
command -v npm  >/dev/null || die "npm is not installed."

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 18 ] || die "Node 18 or newer is required (found $(node -v))."
info "Node $(node -v)"

# ---------------------------------------------------------------------
# Environment
#
# Prompts for the keys and writes .env.local (mode 600). Secrets are read
# with `read -rs` so they never appear on screen or in shell history, and
# only a masked form is echoed back for confirmation.
# ---------------------------------------------------------------------

ENV_FILE="$APP_DIR/.env.local"

mask() {
  local value="$1"
  if [ "${#value}" -le 12 ]; then printf '********'
  else printf '%s…%s' "${value:0:6}" "${value: -4}"; fi
}

# ask <varname> <prompt> <secret:true|false> <required:true|false> [default]
ask() {
  local __var="$1" __prompt="$2" __secret="$3" __required="$4" __default="${5:-}"
  local __value=""

  while :; do
    if [ -n "$__default" ]; then
      printf '  %s [%s]: ' "$__prompt" "$__default"
    else
      printf '  %s: ' "$__prompt"
    fi

    if [ "$__secret" = true ]; then
      read -rs __value || __value=""
      printf '\n'
    else
      read -r __value || __value=""
    fi

    # Strip surrounding whitespace and any quote characters, which would
    # otherwise break the KEY="value" form written below.
    __value="$(printf '%s' "$__value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/"//g')"
    [ -z "$__value" ] && __value="$__default"

    if [ -n "$__value" ]; then
      [ "$__secret" = true ] && printf '    saved as %s\n' "$(mask "$__value")"
      break
    fi
    if [ "$__required" != true ]; then break; fi
    warn "  Required — please enter a value."
  done

  printf -v "$__var" '%s' "$__value"
}

if [ -f "$ENV_FILE" ] || [ -f "$APP_DIR/.env" ]; then
  info "Using the existing $(basename "$ENV_FILE")"
elif [ ! -t 0 ]; then
  warn "No .env.local and no terminal to ask on — starting in demo mode with no database."
else
  step "Configuring the site"
  printf '\n  Paste the values from your Supabase project (Settings -> API)\n'
  printf '  and your email provider. Nothing is echoed back in full.\n\n'

  ask SUPA_URL       "Supabase project URL"        false true
  ask SUPA_ANON      "Supabase anon key"           true  true
  ask SUPA_SERVICE   "Supabase service role key"   true  true

  printf '\n  Email (leave the API key blank to use SMTP from /admin/settings instead)\n\n'
  ask RESEND_KEY     "Resend API key"              true  false
  ask MAIL_FROM_ADDR "Send enquiries FROM"         false false "website@${DOMAIN:-mistymeadowsresorts.com}"
  ask MAIL_TO_ADDR   "Send enquiries TO"           false false "info@mistymeadowsresorts.com"

  # umask before creation so the file is never briefly world-readable.
  ( umask 077
    {
      printf '# Written by deploy.sh on %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      printf '# Contains live credentials. Never commit this file.\n\n'
      printf 'NEXT_PUBLIC_SUPABASE_URL="%s"\n' "$SUPA_URL"
      printf 'NEXT_PUBLIC_SUPABASE_ANON_KEY="%s"\n' "$SUPA_ANON"
      printf 'SUPABASE_SERVICE_ROLE_KEY="%s"\n\n' "$SUPA_SERVICE"
      [ -n "$RESEND_KEY" ] && printf 'RESEND_API_KEY="%s"\n' "$RESEND_KEY"
      [ -n "$MAIL_FROM_ADDR" ] && printf 'MAIL_FROM="%s"\n' "$MAIL_FROM_ADDR"
      [ -n "$MAIL_TO_ADDR" ] && printf 'MAIL_TO="%s"\n' "$MAIL_TO_ADDR"
      [ -n "$DOMAIN" ] && printf '\nSERVER_ACTIONS_ALLOWED_ORIGINS="%s,www.%s"\n' "$DOMAIN" "$DOMAIN"
    } > "$ENV_FILE"
  )
  chmod 600 "$ENV_FILE"

  info "Wrote $ENV_FILE (readable only by $(id -un))"
  warn "Treat these as live credentials. If they have been pasted anywhere"
  warn "public — chat, email, a screenshot — rotate them before going live."
fi

# ---------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------

step "Installing dependencies"
export NEXT_TELEMETRY_DISABLED=1

if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

# npm 11+ gates install scripts behind an approval prompt, and sharp needs
# its own to fetch the native binary Next uses for image optimisation.
if ! node -e "require('sharp')" >/dev/null 2>&1; then
  info "Building sharp (needed for image optimisation)"
  npm rebuild sharp --foreground-scripts >/dev/null 2>&1 || true
  node -e "require('sharp')" >/dev/null 2>&1 \
    || warn "sharp is unavailable; images will be served unoptimised."
fi

step "Building"

# Next spawns a pool of build workers, and each one starts its own rayon
# thread pool inside SWC. When a thread cannot be created the build dies
# with:
#
#   panicked ... The global thread pool has not been initialized.
#   ... IOError(Os { code: 11, kind: WouldBlock })    <- EAGAIN
#   Next.js build worker exited with code: null and signal: SIGABRT
#
# EAGAIN on thread creation is almost never "too few CPUs". The usual
# causes, in order of how often they bite:
#
#   1. `ulimit -s unlimited` (or a very large value). Each new thread
#      reserves RLIMIT_STACK of address space, so an unbounded stack makes
#      pthread_create fail however much RAM the box has.
#   2. A container pid ceiling (cgroup `pids.max`) far below what `ulimit -u`
#      reports — `ulimit -u` shows the rlimit, not the cgroup controller.
#   3. Genuinely too many threads: workers x rayon threads on a big host.
#
# Print all of it, so the real constraint is visible rather than guessed at.

report_limits() {
  local pids_max="n/a" pids_cur="n/a"
  if [ -r /sys/fs/cgroup/pids.max ]; then
    pids_max="$(cat /sys/fs/cgroup/pids.max)"
    pids_cur="$(cat /sys/fs/cgroup/pids.current 2>/dev/null || echo '?')"
  elif [ -r /sys/fs/cgroup/pids/pids.max ]; then
    pids_max="$(cat /sys/fs/cgroup/pids/pids.max)"
    pids_cur="$(cat /sys/fs/cgroup/pids/pids.current 2>/dev/null || echo '?')"
  fi

  info "CPUs            $(nproc 2>/dev/null || echo '?')"
  info "RAM             $(awk '/MemTotal/ {print int($2/1024)" MB"}' /proc/meminfo 2>/dev/null || echo '?')"
  info "stack limit     $(ulimit -s)        <- 'unlimited' here is the usual culprit"
  info "process limit   $(ulimit -u)"
  info "cgroup pids     ${pids_cur} / ${pids_max}"
  info "threads-max     $(cat /proc/sys/kernel/threads-max 2>/dev/null || echo '?')"
  info "max_map_count   $(cat /proc/sys/vm/max_map_count 2>/dev/null || echo '?')"
}

report_limits

build_default() {
  NEXT_TELEMETRY_DISABLED=1 npm run build
}

# Constrained retry. A bounded stack is the fix for cause 1; capping the
# worker pool (NEXT_BUILD_CPUS, read by next.config.mjs) is what actually
# reduces the total thread count for causes 2 and 3 — RAYON_NUM_THREADS on
# its own does not, because each worker is a separate process that sets up
# its own pool.
build_constrained() {
  ( ulimit -s 8192 2>/dev/null || true
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_BUILD_CPUS=1 \
    NEXT_BUILD_WORKER_THREADS=false \
    RAYON_NUM_THREADS=1 \
    npm run build )
}

if ! build_default; then
  warn "Build failed. Retrying with a bounded stack and a single build worker."
  rm -rf .next
  if ! build_constrained; then
    printf '\n'
    warn "Still failing. Read the limits printed above:"
    warn ""
    warn "  stack limit 'unlimited'  ->  run:  ulimit -s 8192 && ./deploy.sh ..."
    warn "  cgroup pids near its max ->  raise the container's pids limit"
    warn "                               (docker run --pids-limit=8192, or"
    warn "                                LimitNPROC= in the systemd unit)"
    warn ""
    warn "To build by hand with everything constrained:"
    warn "  ulimit -s 8192"
    warn "  NEXT_BUILD_CPUS=1 NEXT_BUILD_WORKER_THREADS=false npm run build"
    die "Build failed."
  fi
fi

# ---------------------------------------------------------------------
# Local mode
# ---------------------------------------------------------------------

if [ -z "$DOMAIN" ]; then
  step "Starting locally"
  info "No domain was given, so nothing is published and no certificate is requested."
  info "Serving on http://localhost:${PORT}  (Ctrl-C to stop)"
  info "Admin panel: http://localhost:${PORT}/admin"
  exec npm start -- --port "$PORT"
fi

# ---------------------------------------------------------------------
# Published mode: nginx + certbot + systemd
# ---------------------------------------------------------------------

step "Publishing on $DOMAIN"

SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  command -v sudo >/dev/null || die "Publishing needs root. Re-run as root or install sudo."
  SUDO="sudo"
  info "Using sudo for nginx, certbot and systemd."
fi

if [ -z "$EMAIL" ]; then
  if [ -t 0 ]; then
    printf 'Email for Let'"'"'s Encrypt renewal notices: '
    read -r EMAIL || EMAIL=""
  fi
  [ -n "$EMAIL" ] || die "An email address is required for certbot. Pass --email you@example.com"
fi

# DNS sanity check. Certbot's HTTP challenge cannot succeed unless the domain
# already resolves to this machine, and the failure it prints is opaque.
if command -v getent >/dev/null; then
  RESOLVED="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk 'NR==1 {print $1}' || true)"
  if [ -z "$RESOLVED" ]; then
    warn "$DOMAIN does not resolve yet. Point its A record at this server first,"
    warn "or certbot will fail to verify it."
    if [ -t 0 ]; then
      printf 'Continue anyway? [y/N] '
      read -r reply || reply=""
      case "$reply" in [yY]*) ;; *) die "Stopped." ;; esac
    fi
  else
    info "$DOMAIN resolves to $RESOLVED"
  fi
fi

step "Installing nginx and certbot"
if command -v apt-get >/dev/null; then
  export DEBIAN_FRONTEND=noninteractive
  $SUDO apt-get update -qq
  $SUDO apt-get install -y -qq nginx certbot python3-certbot-nginx
elif command -v dnf >/dev/null; then
  $SUDO dnf install -y nginx certbot python3-certbot-nginx
else
  command -v nginx >/dev/null || die "Install nginx and certbot manually, then re-run."
  command -v certbot >/dev/null || die "Install certbot manually, then re-run."
fi

# --- systemd service -------------------------------------------------

step "Creating the ${APP_NAME} service"

RUN_USER="${SUDO_USER:-$(id -un)}"
[ "$RUN_USER" = "root" ] && warn "Running the app as root is not ideal; consider a dedicated user."

$SUDO tee "/etc/systemd/system/${APP_NAME}.service" >/dev/null <<UNIT
[Unit]
Description=Misty Meadows Resorts website
After=network.target

[Service]
Type=simple
User=${RUN_USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PORT=${PORT}
ExecStart=$(command -v npm) start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

$SUDO systemctl daemon-reload
$SUDO systemctl enable --now "${APP_NAME}.service"
sleep 2
$SUDO systemctl is-active --quiet "${APP_NAME}.service" \
  || die "The app failed to start. Check: journalctl -u ${APP_NAME} -n 50"
info "Service running on 127.0.0.1:${PORT}"

# --- nginx -----------------------------------------------------------

step "Configuring nginx"

# Port 80 only at this stage. certbot --nginx rewrites this file to add the
# TLS block and the redirect once the certificate exists; writing our own 443
# block first would make it fail.
NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"
[ -d /etc/nginx/sites-available ] || NGINX_CONF="/etc/nginx/conf.d/${APP_NAME}.conf"

$SUDO tee "$NGINX_CONF" >/dev/null <<CONF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Next.js already gzips its own responses; let large media stream through.
    client_max_body_size 200M;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
    }
}
CONF

if [ -d /etc/nginx/sites-enabled ]; then
  $SUDO ln -sfn "$NGINX_CONF" "/etc/nginx/sites-enabled/${APP_NAME}"
  # Debian's default site would otherwise answer for this server_name.
  $SUDO rm -f /etc/nginx/sites-enabled/default
fi

$SUDO nginx -t
$SUDO systemctl enable --now nginx
$SUDO systemctl reload nginx
info "nginx proxying ${DOMAIN} → 127.0.0.1:${PORT}"

# --- certificate -----------------------------------------------------

step "Requesting the TLS certificate"

CERTBOT_ARGS=(--nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect)

# Only ask for www when it actually resolves; an unresolvable extra name
# fails the whole request.
if command -v getent >/dev/null && getent ahostsv4 "www.${DOMAIN}" >/dev/null 2>&1; then
  CERTBOT_ARGS+=(-d "www.${DOMAIN}")
  info "Including www.${DOMAIN}"
else
  info "Skipping www.${DOMAIN} — it does not resolve."
fi

[ "$STAGING" = true ] && { CERTBOT_ARGS+=(--staging); warn "Staging certificate — not trusted by browsers."; }

if $SUDO certbot "${CERTBOT_ARGS[@]}"; then
  info "Certificate installed and HTTP redirected to HTTPS."
else
  warn "certbot did not complete. The site is still served over HTTP."
  warn "Common causes: DNS not pointing here yet, or port 80 blocked by a firewall."
  warn "Retry with: sudo certbot --nginx -d ${DOMAIN}"
fi

# Renewal is handled by the certbot systemd timer or cron job shipped with
# the package; make sure whichever exists is active.
$SUDO systemctl enable --now certbot.timer 2>/dev/null || true

$SUDO nginx -t && $SUDO systemctl reload nginx

# ---------------------------------------------------------------------

step "Done"
info "Site:  https://${DOMAIN}"
info "Admin: https://${DOMAIN}/admin"
printf '\n%sUseful commands%s\n' "$BOLD" "$RESET"
info "systemctl status ${APP_NAME}       service state"
info "journalctl -u ${APP_NAME} -f       live logs"
info "./deploy.sh --domain ${DOMAIN}     rebuild and restart after changes"
info "certbot renew --dry-run            check renewal works"
