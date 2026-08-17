#!/usr/bin/env bash
#
# Misty Meadows Resorts — deploy
#
#   ./deploy.sh                     ask for a domain, then build and serve
#   ./deploy.sh --local             run on localhost, skip the prompt
#   ./deploy.sh --domain example.com --email you@example.com
#   ./deploy.sh --skip-build        serve a .next that was built elsewhere
#   ./deploy.sh --build-only        just build, change nothing else
#   ./deploy.sh --dry-run           report what would happen
#
# Leave the domain blank and the site runs locally. Give one and it is
# published behind nginx with a Let's Encrypt certificate from certbot.
#
# On restricted hosting (a per-account process cap), see "Building" below:
# the build is retried under tightening limits, and --skip-build is the
# escape hatch.
#
set -euo pipefail

APP_NAME="misty-meadows"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$APP_DIR/.env.local"

PORT="${PORT:-3000}"
DOMAIN=""
EMAIL="${CERTBOT_EMAIL:-}"
LOCAL_ONLY=false
SKIP_BUILD=false
BUILD_ONLY=false
DRY_RUN=false
STAGING=false

cd "$APP_DIR"

# =====================================================================
# Output
# =====================================================================

if [ -t 1 ]; then
  B=$'\033[1m'; D=$'\033[2m'; R=$'\033[31m'; G=$'\033[32m'; Y=$'\033[33m'; X=$'\033[0m'
else
  B=""; D=""; R=""; G=""; Y=""; X=""
fi

step() { printf '\n%s==>%s %s%s%s\n' "$G" "$X" "$B" "$1" "$X"; }
info() { printf '    %s\n' "$1"; }
warn() { printf '%s !  %s%s\n' "$Y" "$1" "$X"; }
die()  { printf '%s !! %s%s\n' "$R" "$1" "$X" >&2; exit 1; }

# =====================================================================
# Arguments
# =====================================================================

while [ $# -gt 0 ]; do
  case "$1" in
    --domain)     DOMAIN="${2:-}"; shift 2 ;;
    --domain=*)   DOMAIN="${1#*=}"; shift ;;
    --email)      EMAIL="${2:-}"; shift 2 ;;
    --email=*)    EMAIL="${1#*=}"; shift ;;
    --port)       PORT="${2:-}"; shift 2 ;;
    --port=*)     PORT="${1#*=}"; shift ;;
    --local)      LOCAL_ONLY=true; shift ;;
    --skip-build) SKIP_BUILD=true; shift ;;
    --build-only) BUILD_ONLY=true; shift ;;
    --dry-run)    DRY_RUN=true; shift ;;
    --staging)    STAGING=true; shift ;;   # test certs, avoids rate limits
    -h|--help)    sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)            die "Unknown option: $1  (try --help)" ;;
  esac
done

# =====================================================================
# Which domain?
# =====================================================================

if [ "$LOCAL_ONLY" = false ] && [ "$BUILD_ONLY" = false ] && [ -z "$DOMAIN" ]; then
  if [ -t 0 ]; then
    printf '\n%sWhich domain should this be published on?%s\n' "$B" "$X"
    printf '%sLeave blank to just run it locally on this machine.%s\n' "$D" "$X"
    printf 'Domain (e.g. mistymeadowsresorts.com): '
    read -r DOMAIN || DOMAIN=""
  else
    info "No domain given and no terminal to ask on — running locally."
  fi
fi

# Accept a pasted URL and reduce it to the apex host. www is added back later
# as an extra certificate name, so keeping it would ask for www.www.example.com.
if [ -n "$DOMAIN" ]; then
  DOMAIN="$(printf '%s' "$DOMAIN" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')"
  DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN#https://}"
  DOMAIN="${DOMAIN%%/*}"; DOMAIN="${DOMAIN%%:*}"; DOMAIN="${DOMAIN#www.}"

  printf '%s' "$DOMAIN" \
    | grep -qE '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' \
    || die "\"$DOMAIN\" does not look like a domain name."
fi

if [ "$DRY_RUN" = true ]; then
  if [ -n "$DOMAIN" ]; then
    step "Dry run — PUBLISHED mode"
    info "Domain       ${DOMAIN}"
    info "Proxy        ${DOMAIN} -> 127.0.0.1:${PORT} via nginx"
    info "Certificate  certbot --nginx -d ${DOMAIN} --redirect"
    info "Service      ${APP_NAME}.service"
  else
    step "Dry run — LOCAL mode"
    info "Serve        http://localhost:${PORT}"
    info "Nothing published, no certificate requested."
  fi
  [ "$SKIP_BUILD" = true ] && info "Build        skipped (--skip-build)"
  exit 0
fi

# =====================================================================
# Prerequisites
# =====================================================================

step "Checking prerequisites"

command -v node >/dev/null || die "Node.js is not installed."
command -v npm  >/dev/null || die "npm is not installed."
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ] \
  || die "Node 18 or newer is required (found $(node -v))."
info "Node $(node -v), npm $(npm -v)"

# =====================================================================
# Credentials
#
# Prompts and writes .env.local at mode 600. Secrets are read without echo;
# only a masked form is shown back so a paste can be confirmed.
# =====================================================================

mask() {
  local v="$1"
  if [ "${#v}" -le 12 ]; then printf '********'; else printf '%s…%s' "${v:0:6}" "${v: -4}"; fi
}

# ask <var> <prompt> <secret true|false> <required true|false> [default]
ask() {
  local __var="$1" __prompt="$2" __secret="$3" __required="$4" __default="${5:-}" __v=""
  while :; do
    if [ -n "$__default" ]; then printf '  %s [%s]: ' "$__prompt" "$__default"
    else printf '  %s: ' "$__prompt"; fi

    if [ "$__secret" = true ]; then read -rs __v || __v=""; printf '\n'
    else read -r __v || __v=""; fi

    # Trim, and strip quotes so a paste cannot break the KEY="value" form.
    __v="$(printf '%s' "$__v" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/"//g')"
    [ -z "$__v" ] && __v="$__default"

    if [ -n "$__v" ]; then
      [ "$__secret" = true ] && printf '    saved as %s\n' "$(mask "$__v")"
      break
    fi
    [ "$__required" != true ] && break
    warn "  Required — please enter a value."
  done
  printf -v "$__var" '%s' "$__v"
}

if [ -f "$ENV_FILE" ] || [ -f "$APP_DIR/.env" ]; then
  info "Using the existing $(basename "$ENV_FILE")"
elif [ "$BUILD_ONLY" = true ] || [ ! -t 0 ]; then
  warn "No .env.local — running in demo mode with no database."
else
  step "Configuring the site"
  printf '\n  Values come from your Supabase project (Settings -> API) and your\n'
  printf '  email provider. Secrets are never echoed back in full.\n\n'

  ask SUPA_URL     "Supabase project URL"      false true
  ask SUPA_ANON    "Supabase anon key"         true  true
  ask SUPA_SERVICE "Supabase service role key" true  true

  printf '\n  Email — leave the key blank to use SMTP from /admin/settings instead.\n\n'
  ask RESEND_KEY "Resend API key"      true  false
  ask MAIL_FROM_ "Send enquiries FROM" false false "website@${DOMAIN:-mistymeadowsresorts.com}"
  ask MAIL_TO_   "Send enquiries TO"   false false "info@mistymeadowsresorts.com"

  ( umask 077
    {
      printf '# Written by deploy.sh on %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      printf '# Live credentials. Never commit this file.\n\n'
      printf 'NEXT_PUBLIC_SUPABASE_URL="%s"\n'      "$SUPA_URL"
      printf 'NEXT_PUBLIC_SUPABASE_ANON_KEY="%s"\n' "$SUPA_ANON"
      printf 'SUPABASE_SERVICE_ROLE_KEY="%s"\n\n'   "$SUPA_SERVICE"
      [ -n "$RESEND_KEY" ] && printf 'RESEND_API_KEY="%s"\n' "$RESEND_KEY"
      [ -n "$MAIL_FROM_" ] && printf 'MAIL_FROM="%s"\n'      "$MAIL_FROM_"
      [ -n "$MAIL_TO_" ]   && printf 'MAIL_TO="%s"\n'        "$MAIL_TO_"
      [ -n "$DOMAIN" ] && printf '\nSERVER_ACTIONS_ALLOWED_ORIGINS="%s,www.%s"\n' "$DOMAIN" "$DOMAIN"
    } > "$ENV_FILE"
  )
  chmod 600 "$ENV_FILE"
  info "Wrote $ENV_FILE, readable only by $(id -un)"
  warn "If these keys have been pasted anywhere public, rotate them."
fi

# =====================================================================
# Dependencies
# =====================================================================

export NEXT_TELEMETRY_DISABLED=1

if [ "$SKIP_BUILD" = true ]; then
  [ -d .next ] || die "--skip-build needs an existing .next directory here."
  [ -d node_modules ] || die "--skip-build still needs node_modules. Run: npm ci"
  info "Using the existing .next (--skip-build)"
else
  step "Installing dependencies"
  if [ -f package-lock.json ]; then npm ci --no-audit --no-fund
  else npm install --no-audit --no-fund; fi

  # npm 11+ gates install scripts, and sharp needs its own to fetch the
  # binary Next uses for image optimisation.
  if ! node -e "require('sharp')" >/dev/null 2>&1; then
    npm rebuild sharp --foreground-scripts >/dev/null 2>&1 || true
    node -e "require('sharp')" >/dev/null 2>&1 \
      || warn "sharp unavailable — images will be served unoptimised."
  fi
fi

# =====================================================================
# Building
#
# The failure this guards against:
#
#   panicked ... The global thread pool has not been initialized.
#   ... IOError(Os { code: 11, kind: WouldBlock })      <- EAGAIN
#   Next.js build worker exited with code: null and signal: SIGABRT
#
# Next's SWC starts a rayon thread pool sized from the CPU count the OS
# reports. On shared and managed hosting the visible CPU count belongs to
# the machine, while the *thread* allowance belongs to your account and is
# enforced by the kernel (CloudLinux LVE and similar). A box advertising 32
# CPUs on an account capped at 50 processes will try to start ~32 rayon
# threads plus V8's pool, libuv's pool and a build worker, and be refused.
#
# `ulimit -u` does not show that cap — it reports the rlimit, which such
# hosts leave enormous. RAYON_NUM_THREADS does not fix it either, because
# SWC sizes its own pool from num_cpus rather than reading that variable.
#
# What does work is narrowing CPU affinity: num_cpus honours
# sched_getaffinity, so under `taskset -c 0` the process genuinely sees one
# CPU and asks for one thread. The attempts below tighten affinity, Next's
# worker count, V8's pool and libuv's pool together.
# =====================================================================

show_limits() {
  local pmax="n/a" pcur="n/a"
  if [ -r /sys/fs/cgroup/pids.max ]; then
    pmax="$(cat /sys/fs/cgroup/pids.max)"
    pcur="$(cat /sys/fs/cgroup/pids.current 2>/dev/null || echo '?')"
  elif [ -r /sys/fs/cgroup/pids/pids.max ]; then
    pmax="$(cat /sys/fs/cgroup/pids/pids.max)"
    pcur="$(cat /sys/fs/cgroup/pids/pids.current 2>/dev/null || echo '?')"
  fi

  info "CPUs visible   $(nproc 2>/dev/null || echo '?')"
  info "RAM            $(awk '/MemTotal/ {print int($2/1024)" MB"}' /proc/meminfo 2>/dev/null || echo '?')"
  info "cgroup pids    ${pcur} / ${pmax}"
  info "your threads   $(ps -Lu "$(id -u)" --no-headers 2>/dev/null | wc -l) in use"
  info ""
  info "${D}A Next build needs roughly 120-130 threads at peak, even pinned to"
  info "one CPU with one worker — that figure is measured, not estimated."
  info "If your hosting panel caps \"Number of Processes\" below about 150,"
  info "the build cannot run here and --skip-build is the way. ulimit does"
  info "not report that cap, so the panel is the number to trust.${X}"
}

# build <description> <cpu-list|-> <workers|->
build() {
  local desc="$1" cpus="$2" workers="$3"
  local -a cmd=()

  if [ "$cpus" != "-" ] && command -v taskset >/dev/null; then
    cmd+=(taskset -c "$cpus")
  fi

  cmd+=(env NEXT_TELEMETRY_DISABLED=1)

  if [ "$workers" != "-" ]; then
    cmd+=(
      "NEXT_BUILD_CPUS=${workers}"
      "NEXT_BUILD_WORKER_THREADS=false"
      "RAYON_NUM_THREADS=${workers}"
      "UV_THREADPOOL_SIZE=${workers}"
      # --v8-pool-size caps V8's own worker threads, which otherwise scale
      # with the visible CPU count just as rayon's do.
      "NODE_OPTIONS=--v8-pool-size=${workers} --max-old-space-size=1536"
    )
  fi

  cmd+=(npm run build)

  printf '\n'
  info "${B}Attempt: ${desc}${X}"
  ( ulimit -s 8192 2>/dev/null || true; "${cmd[@]}" )
}

if [ "$SKIP_BUILD" = false ]; then
  step "Building"
  show_limits

  BUILT=false
  # description | cpu list | worker count
  ATTEMPTS=(
    "full parallelism|-|-"
    "4 CPUs, 4 workers|0-3|4"
    "1 CPU, 1 worker|0|1"
  )

  for attempt in "${ATTEMPTS[@]}"; do
    IFS='|' read -r a_desc a_cpus a_workers <<< "$attempt"
    if build "$a_desc" "$a_cpus" "$a_workers"; then
      BUILT=true
      break
    fi
    warn "Failed. Cleaning up and trying tighter limits."
    rm -rf .next
  done

  if [ "$BUILT" = false ]; then
    printf '\n'
    warn "This host cannot build the site, and no setting will change that."
    warn ""
    warn "The last attempt was pinned to one CPU with one worker — the least"
    warn "parallel configuration there is — and still failed. A Next build"
    warn "needs about 120-130 threads at peak even like that. If your panel"
    warn "caps processes below roughly 150, the build simply does not fit."
    warn ""
    warn "${B}Build elsewhere and serve the output here.${X} Running the site costs"
    warn "only a couple of processes, so it is only the build that is a"
    warn "problem:"
    warn ""
    warn "    # on your laptop, or in CI, in a clone of this repo"
    warn "    npm ci && npm run build"
    warn "    rsync -az --delete .next/ ${USER}@<server>:${APP_DIR}/.next/"
    warn ""
    warn "    # back here"
    warn "    ./deploy.sh --skip-build --domain ${DOMAIN:-example.com}"
    warn ""
    warn "Or move to a host without a per-account process cap — a small VPS"
    warn "has none — or ask this one to raise it (CloudLinux calls it LVE"
    warn "\"NPROC\")."
    die "Build failed."
  fi
fi

if [ "$BUILD_ONLY" = true ]; then
  step "Done"
  info "Built. Nothing else was changed (--build-only)."
  exit 0
fi

# =====================================================================
# Local mode
# =====================================================================

if [ -z "$DOMAIN" ]; then
  step "Starting locally"
  info "Nothing published, no certificate requested."
  info "Site:  http://localhost:${PORT}"
  info "Admin: http://localhost:${PORT}/admin"
  info "Ctrl-C to stop."
  exec npm start -- --port "$PORT"
fi

# =====================================================================
# Published mode — systemd, nginx, certbot
# =====================================================================

step "Publishing on $DOMAIN"

SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  command -v sudo >/dev/null || die "Publishing needs root. Re-run as root, or install sudo."
  SUDO="sudo"
fi

if [ -z "$EMAIL" ]; then
  if [ -t 0 ]; then
    printf "Email for Let's Encrypt renewal notices: "
    read -r EMAIL || EMAIL=""
  fi
  [ -n "$EMAIL" ] || die "certbot needs an email address. Pass --email you@example.com"
fi

# certbot's HTTP challenge cannot succeed until the domain points here, and
# the error it prints when that is wrong is not obvious.
if command -v getent >/dev/null; then
  RESOLVED="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk 'NR==1 {print $1}' || true)"
  if [ -n "$RESOLVED" ]; then
    info "$DOMAIN resolves to $RESOLVED"
  else
    warn "$DOMAIN does not resolve yet — point its A record at this server first."
    if [ -t 0 ]; then
      printf 'Continue anyway? [y/N] '
      read -r reply || reply=""
      case "$reply" in [yY]*) ;; *) die "Stopped." ;; esac
    fi
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
  command -v nginx   >/dev/null || die "Install nginx manually, then re-run."
  command -v certbot >/dev/null || die "Install certbot manually, then re-run."
fi

step "Creating the ${APP_NAME} service"

RUN_USER="${SUDO_USER:-$(id -un)}"
[ "$RUN_USER" = "root" ] && warn "Running as root is not ideal; consider a dedicated user."

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

step "Configuring nginx"

# Port 80 only at this stage. certbot --nginx rewrites this file to add the
# TLS server block and the redirect; writing our own 443 block first breaks it.
NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"
[ -d /etc/nginx/sites-available ] || NGINX_CONF="/etc/nginx/conf.d/${APP_NAME}.conf"

$SUDO tee "$NGINX_CONF" >/dev/null <<CONF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

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
  $SUDO rm -f /etc/nginx/sites-enabled/default
fi

$SUDO nginx -t
$SUDO systemctl enable --now nginx
$SUDO systemctl reload nginx
info "nginx proxying ${DOMAIN} -> 127.0.0.1:${PORT}"

step "Requesting the TLS certificate"

CERTBOT_ARGS=(--nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect)

# An unresolvable extra name fails the whole request, so only ask for www
# when it actually resolves.
if command -v getent >/dev/null && getent ahostsv4 "www.${DOMAIN}" >/dev/null 2>&1; then
  CERTBOT_ARGS+=(-d "www.${DOMAIN}")
  info "Including www.${DOMAIN}"
fi

[ "$STAGING" = true ] && { CERTBOT_ARGS+=(--staging); warn "Staging certificate — browsers will not trust it."; }

if $SUDO certbot "${CERTBOT_ARGS[@]}"; then
  info "Certificate installed, HTTP redirected to HTTPS."
else
  warn "certbot did not complete — the site is still served over HTTP."
  warn "Usually DNS has not propagated, or port 80 is firewalled."
  warn "Retry with: sudo certbot --nginx -d ${DOMAIN}"
fi

$SUDO systemctl enable --now certbot.timer 2>/dev/null || true
$SUDO nginx -t && $SUDO systemctl reload nginx

step "Done"
info "Site:  https://${DOMAIN}"
info "Admin: https://${DOMAIN}/admin"
printf '\n%sUseful commands%s\n' "$B" "$X"
info "systemctl status ${APP_NAME}     service state"
info "journalctl -u ${APP_NAME} -f     live logs"
info "./deploy.sh --domain ${DOMAIN}   rebuild and restart"
info "certbot renew --dry-run          check renewal"
