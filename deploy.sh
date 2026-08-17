#!/usr/bin/env bash
#
# Misty Meadows Resorts — deploy
#
#   ./deploy.sh                     build, then start the site
#   ./deploy.sh --domain example.com --email you@example.com
#   ./deploy.sh --local             localhost only, skip the prompt
#   ./deploy.sh --skip-build        serve a .next built elsewhere
#   ./deploy.sh --build-only        just build, change nothing else
#   ./deploy.sh --dry-run           report what would happen
#
#   ./deploy.sh --status            is it running?
#   ./deploy.sh --logs              follow the log
#   ./deploy.sh --restart           restart it
#   ./deploy.sh --stop              stop it
#
# Works with or without root. With root it installs nginx, a systemd unit
# and a certbot certificate. Without root — shared hosting, no sudo — it
# runs the site under your own account and prints how to point the domain
# at it through your hosting panel.
#
set -euo pipefail

APP_NAME="misty-meadows"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$APP_DIR/.env.local"
RUN_DIR="$APP_DIR/.deploy"
PID_FILE="$RUN_DIR/app.pid"
LOG_FILE="$RUN_DIR/app.log"

PORT="${PORT:-3000}"
DOMAIN=""
EMAIL="${CERTBOT_EMAIL:-}"
LOCAL_ONLY=false
SKIP_BUILD=false
BUILD_ONLY=false
DRY_RUN=false
STAGING=false
ACTION="deploy"

cd "$APP_DIR"
mkdir -p "$RUN_DIR"

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
    --status)     ACTION="status"; shift ;;
    --logs)       ACTION="logs"; shift ;;
    --stop)       ACTION="stop"; shift ;;
    --restart)    ACTION="restart"; shift ;;
    -h|--help)    sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)            die "Unknown option: $1  (try --help)" ;;
  esac
done

# =====================================================================
# Privilege
#
# Shared hosting gives a plain user: no sudo, no su, no package manager.
# Detect that once, and take the unprivileged path rather than failing.
# =====================================================================

SUDO=""
HAVE_ROOT=false

if [ "$(id -u)" -eq 0 ]; then
  HAVE_ROOT=true
elif command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
  HAVE_ROOT=true
  SUDO="sudo"
fi

# =====================================================================
# Process control (no systemd required)
# =====================================================================

app_pid() {
  [ -f "$PID_FILE" ] || return 1
  local pid
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  [ -n "$pid" ] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  printf '%s' "$pid"
}

start_app() {
  if app_pid >/dev/null; then
    info "Already running as pid $(app_pid)"
    return 0
  fi

  [ -d .next ] || die "Nothing built yet. Run ./deploy.sh first."

  # `next` directly rather than `npm start`: one process to track instead of
  # npm plus its child, which also matters when the account has a low
  # process cap. setsid detaches it so it survives logout.
  setsid nohup ./node_modules/.bin/next start -p "$PORT" \
    >>"$LOG_FILE" 2>&1 < /dev/null &
  echo $! > "$PID_FILE"

  # Give it a moment, then confirm it is actually up rather than assuming.
  local waited=0
  while [ "$waited" -lt 20 ]; do
    if ! app_pid >/dev/null; then
      warn "The site exited immediately. Last lines of $LOG_FILE:"
      tail -n 20 "$LOG_FILE" 2>/dev/null | sed 's/^/    /'
      return 1
    fi
    if curl -fsS -o /dev/null --max-time 2 "http://127.0.0.1:${PORT}/" 2>/dev/null; then
      info "Running as pid $(app_pid) on 127.0.0.1:${PORT}"
      return 0
    fi
    sleep 1
    waited=$((waited + 1))
  done

  warn "Started as pid $(app_pid), but it did not answer on port ${PORT} yet."
  warn "Check: ./deploy.sh --logs"
  return 0
}

stop_app() {
  local pid
  if ! pid="$(app_pid)"; then
    info "Not running."
    return 0
  fi

  kill "$pid" 2>/dev/null || true
  local waited=0
  while kill -0 "$pid" 2>/dev/null && [ "$waited" -lt 10 ]; do
    sleep 1; waited=$((waited + 1))
  done
  kill -9 "$pid" 2>/dev/null || true
  rm -f "$PID_FILE"
  info "Stopped."
}

case "$ACTION" in
  status)
    if pid="$(app_pid)"; then
      step "Running"
      info "pid       $pid"
      info "port      $PORT"
      info "threads   $(ls "/proc/$pid/task" 2>/dev/null | wc -l)"
      info "local     http://127.0.0.1:${PORT}/"
      curl -fsS -o /dev/null --max-time 3 "http://127.0.0.1:${PORT}/" 2>/dev/null \
        && info "responds  yes" || warn "responds  no — see ./deploy.sh --logs"
    else
      step "Not running"
      info "Start it with: ./deploy.sh --skip-build"
    fi
    exit 0 ;;
  logs)
    [ -f "$LOG_FILE" ] || die "No log yet at $LOG_FILE"
    exec tail -n 100 -f "$LOG_FILE" ;;
  stop)
    step "Stopping"; stop_app; exit 0 ;;
  restart)
    step "Restarting"; stop_app; start_app; exit $? ;;
esac

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
  if [ -n "$DOMAIN" ] && [ "$HAVE_ROOT" = true ]; then
    step "Dry run — PUBLISHED mode (root available)"
    info "Proxy        ${DOMAIN} -> 127.0.0.1:${PORT} via nginx"
    info "Certificate  certbot --nginx -d ${DOMAIN} --redirect"
    info "Service      ${APP_NAME}.service"
  elif [ -n "$DOMAIN" ]; then
    step "Dry run — PUBLISHED mode (no root)"
    info "Domain       ${DOMAIN}"
    info "App          runs as $(id -un) on 127.0.0.1:${PORT}"
    info "Proxy & TLS  configured in your hosting panel — instructions printed"
  else
    step "Dry run — LOCAL mode"
    info "Serve        http://localhost:${PORT}"
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
info "Running as $(id -un)$([ "$HAVE_ROOT" = true ] && echo ' (root available)' || echo ' (no root — unprivileged mode)')"

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
#   panicked ... The global thread pool has not been initialized.
#   ... IOError(Os { code: 11, kind: WouldBlock })      <- EAGAIN
#
# Next's SWC starts a rayon thread pool sized from the CPU count the OS
# reports. On shared hosting that count belongs to the machine while the
# *thread* allowance belongs to your account, enforced by the kernel
# (CloudLinux LVE and similar) and invisible to `ulimit`, which such hosts
# leave enormous.
#
# RAYON_NUM_THREADS does not help: SWC sizes its own pool from num_cpus
# rather than reading it. Narrowing CPU affinity does, because num_cpus
# honours sched_getaffinity — under `taskset -c 0` the process genuinely
# sees one CPU. The attempts below tighten affinity, Next's worker count,
# V8's pool and libuv's pool together.
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
  info "${D}A build peaks near 120-130 threads even at one CPU and one worker."
  info "Serving the finished site needs only about a dozen. If your panel"
  info "caps processes below ~150, use --skip-build with a .next built"
  info "elsewhere; ulimit does not report that cap.${X}"
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
      # V8's pool scales with the visible CPU count just as rayon's does.
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
  ATTEMPTS=(
    "full parallelism|-|-"
    "4 CPUs, 4 workers|0-3|4"
    "1 CPU, 1 worker|0|1"
  )

  for attempt in "${ATTEMPTS[@]}"; do
    IFS='|' read -r a_desc a_cpus a_workers <<< "$attempt"
    if build "$a_desc" "$a_cpus" "$a_workers"; then BUILT=true; break; fi
    warn "Failed. Cleaning up and trying tighter limits."
    rm -rf .next
  done

  if [ "$BUILT" = false ]; then
    printf '\n'
    warn "This host cannot build the site, and no setting will change that."
    warn "The last attempt used one CPU and one worker — the least parallel"
    warn "configuration there is."
    warn ""
    warn "${B}Build elsewhere and serve the output here.${X} Running the site costs"
    warn "about a dozen threads, so only the build is a problem:"
    warn ""
    warn "    # on your laptop, or in CI, in a clone of this repo"
    warn "    npm ci && npm run build"
    warn "    rsync -az --delete .next/ $(id -un)@<server>:${APP_DIR}/.next/"
    warn ""
    warn "    # back here"
    warn "    ./deploy.sh --skip-build --domain ${DOMAIN:-example.com}"
    die "Build failed."
  fi
fi

if [ "$BUILD_ONLY" = true ]; then
  step "Done"
  info "Built. Nothing else was changed (--build-only)."
  exit 0
fi

# =====================================================================
# Start the site
# =====================================================================

step "Starting the site"
stop_app
start_app || die "The site did not start. See ./deploy.sh --logs"

if [ -z "$DOMAIN" ]; then
  step "Done — local only"
  info "Site:  http://localhost:${PORT}"
  info "Admin: http://localhost:${PORT}/admin"
  info ""
  info "It keeps running in the background. ./deploy.sh --stop to stop it."
  exit 0
fi

# =====================================================================
# Publishing WITHOUT root — shared hosting
#
# nginx, systemd and certbot all need root. On shared hosting the panel
# already runs a web server and issues certificates, so the job here is to
# run the app and hand over the two files the panel needs.
# =====================================================================

if [ "$HAVE_ROOT" = false ]; then
  step "Publishing on ${DOMAIN} (no root — using your hosting panel)"

  # Passenger, which cPanel's "Setup Node.js App" uses, needs a startup
  # file. Next has no such entry point of its own, so write one.
  cat > "$APP_DIR/server.js" <<'SERVER'
/*
 * Startup file for cPanel "Setup Node.js App" (Phusion Passenger).
 *
 * Passenger requires a plain Node entry point and supplies the port, so
 * this hands requests to Next's own handler. Not used when the site is
 * started by deploy.sh directly.
 */
const http = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http.createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`Misty Meadows listening on ${port}`);
  });
});
SERVER

  # And a reverse-proxy snippet for the Apache/LiteSpeed case.
  cat > "$RUN_DIR/htaccess-snippet.txt" <<HTACCESS
# Put this in the .htaccess of the document root for ${DOMAIN}
# (usually ~/public_html or ~/public_html/${DOMAIN}).
#
# It forwards every request to the Node process this script started.
# Requires mod_proxy; if your host disables it, use the panel's
# "Setup Node.js App" with server.js instead.

RewriteEngine On

# Force HTTPS once the panel has issued a certificate.
RewriteCond %{HTTPS} !=on
RewriteRule ^(.*)\$ https://%{HTTP_HOST}/\$1 [R=301,L]

RewriteRule ^(.*)\$ http://127.0.0.1:${PORT}/\$1 [P,L]
HTACCESS

  info "The site is running as $(id -un) on 127.0.0.1:${PORT}."
  info ""
  info "${B}Two files have been written for the panel:${X}"
  info "  server.js                        startup file for a Node app"
  info "  .deploy/htaccess-snippet.txt     reverse-proxy rules"
  info ""
  info "${B}Point ${DOMAIN} at it — whichever your panel offers:${X}"
  info ""
  info "  ${B}A. Setup Node.js App${X} (cPanel / CloudLinux — the reliable one)"
  info "     Application root      ${APP_DIR}"
  info "     Application URL       ${DOMAIN}"
  info "     Application startup   server.js"
  info "     Node version          $(node -v)"
  info "     Then press Restart. The panel runs and supervises it, so you"
  info "     can stop this copy with ./deploy.sh --stop"
  info ""
  info "  ${B}B. Reverse proxy${X} — paste .deploy/htaccess-snippet.txt into the"
  info "     .htaccess of the document root for ${DOMAIN}."
  info ""
  info "${B}HTTPS:${X} issue it from the panel — \"SSL/TLS Status\", AutoSSL or"
  info "\"Let's Encrypt\". certbot cannot run here; it needs root."
  info ""
  info "${B}Keeping it alive:${X} option A is supervised by the panel. With"
  info "option B, re-run ./deploy.sh --skip-build after a reboot, or add a"
  info "cron entry in the panel:"
  info "     @reboot cd ${APP_DIR} && ./deploy.sh --skip-build --local"
  info ""
  step "Done"
  info "Local check: curl -I http://127.0.0.1:${PORT}/"
  info "Status:      ./deploy.sh --status"
  info "Logs:        ./deploy.sh --logs"
  exit 0
fi

# =====================================================================
# Publishing WITH root — nginx, systemd, certbot
# =====================================================================

step "Publishing on ${DOMAIN} (root available)"

if [ -z "$EMAIL" ]; then
  if [ -t 0 ]; then
    printf "Email for Let's Encrypt renewal notices: "
    read -r EMAIL || EMAIL=""
  fi
  [ -n "$EMAIL" ] || die "certbot needs an email address. Pass --email you@example.com"
fi

# certbot's HTTP challenge cannot succeed until the domain points here.
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

# The background copy is replaced by the systemd unit below.
stop_app

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
ExecStart=${APP_DIR}/node_modules/.bin/next start -p ${PORT}
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
