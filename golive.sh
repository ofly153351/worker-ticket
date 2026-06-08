#!/usr/bin/env bash
# =============================================================================
# Hermes Bug Tracker (obx-ticket) — Go Live Script
# รัน script เดียวเพื่อ build + start + เปิด Cloudflare Tunnel ให้พร้อมใช้งานจริง
#
# Stack:
#   Frontend  Vue 3 + Vite          → localhost:1818  (vite preview)
#   Backend   Express + Prisma      → localhost:4000  (node dist/server.js)
#   Database  PostgreSQL (Docker)   → localhost:5432  (db: bug_ticket_db)
#   Storage   MinIO (Docker)        → localhost:9000  (bucket: obx-ticket)
#   Agent     Hermes CLI            → per-project daily summary
#
# Public (Cloudflare Tunnel, same zone as POS, different subdomains):
#   ticket.<zone>        → frontend
#   ticket-api.<zone>    → backend API
#   ticket-media.<zone>  → MinIO (public image URLs)
#
# Usage:
#   chmod +x golive.sh
#   ./golive.sh              # git pull → build → start + (first run) configure tunnel
#   ./golive.sh --no-tunnel  # skip Cloudflare tunnel (local only)
#   ./golive.sh --no-pull    # skip git pull (build current working tree)
#   ./golive.sh --help
#
# Git pull: force-syncs to origin/main using a token from ~/.github_token
#   echo 'ghp_xxx' > ~/.github_token && chmod 600 ~/.github_token
#   (.env / dist / node_modules are gitignored → survive the sync)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR"
BACKEND_DIR="$SCRIPT_DIR/backend"
LOG_FILE="$SCRIPT_DIR/golive.log"

# Cloudflare tunnel — SHARE the existing POS tunnel (one cloudflared, many hosts).
# We just add ticket.* ingress rules to its config + route DNS to it.
SHARED_TUNNEL_CONFIG="$HOME/.cloudflared/config.yml"   # POS / shared tunnel config
SHARED_TUNNEL_PM2="pos-tunnel"                         # PM2 name of the running tunnel
ZONE_FILE="$SCRIPT_DIR/.tunnel_zone"                   # remembers chosen zone/subdomains

# Shared Docker containers (provided by pos-backend stack)
PG_CONTAINER="pos-backend-postgres-1"
MC_CONTAINER="pos-backend-minio-client-1"     # mc client for bucket ops
DB_NAME="bug_ticket_db"
MINIO_BUCKET="obx-ticket"

# Local ports
FE_PORT=1818
BE_PORT=4000
MINIO_PORT=9000

# Default subdomains (same zone as POS, distinct prefixes)
DEF_FE_SUB="ticket"
DEF_BE_SUB="ticket-api"
DEF_MEDIA_SUB="ticket-media"

# ── Git auth (deploy pulls latest from origin/main) ──────────────────────────
# Single repo: frontend at root + backend in backend/  → one sync covers both.
GITHUB_USER="ofly153351"
GITHUB_TOKEN_FILE="$HOME/.github_token"   # token เก็บแยกไฟล์ ไม่ hard-code ใน script
GIT_BRANCH="main"

WITH_TUNNEL=true
WITH_PULL=true
for arg in "$@"; do
  case $arg in
    --no-tunnel) WITH_TUNNEL=false ;;
    --no-pull)   WITH_PULL=false ;;
    --help)
      awk 'NR==1{next} /^[^#]/{exit} {sub(/^# ?/,""); print}' "$0"
      exit 0 ;;
  esac
done

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
ok()   { echo -e "${GREEN}✔${RESET}  $*"; }
info() { echo -e "${CYAN}→${RESET}  $*"; }
warn() { echo -e "${YELLOW}⚠${RESET}  $*"; }
die()  { echo -e "${RED}✖${RESET}  $*" >&2; exit 1; }
step() { echo -e "\n${BOLD}━━━  $*${RESET}"; }

# load nvm (so node/npm/pm2 are on PATH in non-interactive shells)
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"
# hermes CLI lives in ~/.local/bin
export PATH="$PATH:$HOME/.local/bin"

# ── Git helpers (token-based pull, no token persisted in git config) ─────────
# Build a tokenized fetch URL from origin WITHOUT writing the token to git config.
# Strips any existing creds first → idempotent (safe to re-run).
tokened_url() {
  local clean
  clean=$(git -C "$1" remote get-url origin | sed -E 's#https://[^@/]+@#https://#')
  echo "$clean" | sed "s#https://#https://${GITHUB_USER}:${GITHUB_TOKEN}@#"
}

# Force-sync a repo to origin/<GIT_BRANCH> regardless of current branch / local state.
sync_repo() {
  local dir="$1" name="$2" url
  url=$(tokened_url "$dir")
  info "Syncing $name → origin/$GIT_BRANCH..."
  git -C "$dir" fetch "$url" "$GIT_BRANCH" >>"$LOG_FILE" 2>&1 || die "$name: git fetch failed (เช็ค token ใน $GITHUB_TOKEN_FILE)"
  git -C "$dir" checkout -B "$GIT_BRANCH" >>"$LOG_FILE" 2>&1 || die "$name: checkout failed"
  git -C "$dir" reset --hard FETCH_HEAD >>"$LOG_FILE" 2>&1 || die "$name: reset failed"
  ok "$name updated → $(git -C "$dir" rev-parse --short HEAD)"
}

echo "" > "$LOG_FILE"
echo -e "${BOLD}"
echo "  🐞  Hermes Bug Tracker — Go Live"
echo -e "${RESET}  log: $LOG_FILE"

# ── 0. Pre-flight ────────────────────────────────────────────────────────────
step "Pre-flight checks"
[[ -d "$BACKEND_DIR" ]]   || die "ไม่พบ backend/ ที่ $BACKEND_DIR"
# production prefers .env.production; fall back to .env (backward compatible)
if [[ -f "$BACKEND_DIR/.env.production" ]]; then
  BACKEND_ENV="$BACKEND_DIR/.env.production"
elif [[ -f "$BACKEND_DIR/.env" ]]; then
  BACKEND_ENV="$BACKEND_DIR/.env"
else
  die "ไม่พบ backend/.env หรือ .env.production — คัดลอกจาก .env.production.example ก่อน"
fi
ok "backend env: $(basename "$BACKEND_ENV")"
command -v node  &>/dev/null || die "node ไม่ได้ติดตั้ง"
command -v npm   &>/dev/null || die "npm ไม่ได้ติดตั้ง"
command -v docker &>/dev/null || die "docker ไม่ได้ติดตั้ง"
command -v pm2   &>/dev/null || { info "ติดตั้ง pm2..."; npm install -g pm2 >>"$LOG_FILE" 2>&1; }
command -v hermes &>/dev/null || warn "ไม่พบ hermes CLI — agent จะใช้ mock summary (ตั้ง HERMES_AGENT_ENABLED=false ได้)"
if [[ "$WITH_TUNNEL" == true ]]; then
  command -v cloudflared &>/dev/null || die "cloudflared ไม่ได้ติดตั้ง — รัน: brew install cloudflared (หรือใช้ --no-tunnel)"
fi
ok "เครื่องมือพร้อม"

# ── 0.5 Git pull latest (origin/main) ────────────────────────────────────────
# Pulls only when a token file exists (so local dev runs aren't force-reset).
# Use --no-pull to skip explicitly.
if [[ "$WITH_PULL" == true ]]; then
  step "Git sync (origin/$GIT_BRANCH)"
  if [[ ! -d "$SCRIPT_DIR/.git" ]]; then
    warn "ไม่ใช่ git repo — ข้ามการ pull"
  elif [[ ! -f "$GITHUB_TOKEN_FILE" ]]; then
    warn "ไม่พบ token file ที่ $GITHUB_TOKEN_FILE — ข้ามการ pull"
    warn "สร้างด้วย: echo 'ghp_xxx' > $GITHUB_TOKEN_FILE && chmod 600 $GITHUB_TOKEN_FILE"
  else
    GITHUB_TOKEN="$(tr -d '[:space:]' < "$GITHUB_TOKEN_FILE")"
    sync_repo "$SCRIPT_DIR" "obx-ticket"   # single repo = frontend root + backend/
  fi
else
  info "ข้าม git pull (--no-pull)"
fi

# load backend env (DATABASE_URL, MINIO_*, etc.) — read AFTER pull
set -a; source "$BACKEND_ENV"; set +a

# ── 1. Verify shared Docker services (Postgres + MinIO) ──────────────────────
step "Docker services (PostgreSQL + MinIO)"
if ! docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
  warn "ไม่พบ container $PG_CONTAINER ที่กำลังรัน"
  info "พยายามสตาร์ท pos-backend stack..."
  ( cd /Users/obx/projects/pos-backend 2>/dev/null && docker compose up -d postgres minio minio-client >>"$LOG_FILE" 2>&1 ) \
    || die "สตาร์ท Postgres/MinIO ไม่ได้ — เปิด pos-backend docker stack เองก่อน"
fi
# wait for postgres
attempts=0
until docker exec "$PG_CONTAINER" pg_isready -U postgres &>/dev/null; do
  attempts=$((attempts+1)); (( attempts > 30 )) && die "Postgres ไม่ตอบสนอง"
  sleep 1
done
ok "PostgreSQL พร้อม"

# create app database if missing
if ! docker exec "$PG_CONTAINER" psql -U postgres -lqt | cut -d'|' -f1 | grep -qw "$DB_NAME"; then
  info "สร้าง database $DB_NAME..."
  docker exec "$PG_CONTAINER" psql -U postgres -c "CREATE DATABASE $DB_NAME;" >>"$LOG_FILE" 2>&1
  ok "สร้าง $DB_NAME แล้ว"
else
  ok "database $DB_NAME มีอยู่แล้ว"
fi

# ensure MinIO bucket exists + public
if docker ps --format '{{.Names}}' | grep -q "^${MC_CONTAINER}$"; then
  docker exec "$MC_CONTAINER" mc alias set local "http://${PG_CONTAINER%-postgres-1}-minio-1:9000" \
    "${MINIO_ACCESS_KEY:-minioadmin}" "${MINIO_SECRET_KEY:-change-me}" >>"$LOG_FILE" 2>&1 || true
  docker exec "$MC_CONTAINER" mc mb -p "local/$MINIO_BUCKET" >>"$LOG_FILE" 2>&1 || true
  docker exec "$MC_CONTAINER" mc anonymous set public "local/$MINIO_BUCKET" >>"$LOG_FILE" 2>&1 || true
  ok "MinIO bucket '$MINIO_BUCKET' พร้อม (public read)"
else
  warn "ไม่พบ mc client container — ข้ามการตั้ง bucket (ตรวจเองว่า bucket public)"
fi

# ── 2. Cloudflare Tunnel — share the POS tunnel, add ticket.* hosts ──────────
FE_HOST=""; BE_HOST=""; MEDIA_HOST=""
TUNNEL_CHANGED=false
if [[ "$WITH_TUNNEL" == true ]]; then
  step "Cloudflare Tunnel (shared)"

  [[ -f "$SHARED_TUNNEL_CONFIG" ]] || die "ไม่พบ shared tunnel config $SHARED_TUNNEL_CONFIG — ตั้ง POS tunnel ให้รันก่อน"

  # tunnel id/name read straight from the shared config's `tunnel:` line
  TUNNEL_REF=$(grep -E '^[[:space:]]*tunnel:' "$SHARED_TUNNEL_CONFIG" | head -1 | awk '{print $2}')
  [[ -n "$TUNNEL_REF" ]] || die "อ่าน tunnel id จาก $SHARED_TUNNEL_CONFIG ไม่ได้"
  ok "ใช้ tunnel ร่วมกับ POS (ref: $TUNNEL_REF)"

  # zone / subdomains — prompt once, remember
  if [[ -f "$ZONE_FILE" ]]; then
    ZONE=$(sed -n '1p' "$ZONE_FILE")
    FE_HOST=$(sed -n '2p' "$ZONE_FILE")
    BE_HOST=$(sed -n '3p' "$ZONE_FILE")
    MEDIA_HOST=$(sed -n '4p' "$ZONE_FILE")
    ok "ใช้ค่าเดิม: $FE_HOST / $BE_HOST / $MEDIA_HOST"
  else
    echo ""
    echo -e "${BOLD}ตั้งค่า subdomain (zone เดียวกับ POS):${RESET}"
    read -rp "  Domain / zone (เช่น example.com)        : " ZONE
    [[ -n "$ZONE" ]] || die "ต้องระบุ zone"
    read -rp "  Subdomain frontend  [${DEF_FE_SUB}]      : " s1;  s1="${s1:-$DEF_FE_SUB}"
    read -rp "  Subdomain backend   [${DEF_BE_SUB}]      : " s2;  s2="${s2:-$DEF_BE_SUB}"
    read -rp "  Subdomain media     [${DEF_MEDIA_SUB}]   : " s3;  s3="${s3:-$DEF_MEDIA_SUB}"
    FE_HOST="${s1}.${ZONE}"; BE_HOST="${s2}.${ZONE}"; MEDIA_HOST="${s3}.${ZONE}"
    printf '%s\n%s\n%s\n%s\n' "$ZONE" "$FE_HOST" "$BE_HOST" "$MEDIA_HOST" > "$ZONE_FILE"
    ok "บันทึกค่าไว้ที่ $ZONE_FILE"
  fi

  # merge ticket.* ingress rules into the shared config (idempotent + backup).
  # Inserts BEFORE the `service: http_status:404` catch-all so they take effect.
  if grep -q "hostname: ${FE_HOST}" "$SHARED_TUNNEL_CONFIG"; then
    ok "ingress ticket.* มีอยู่ใน shared config แล้ว"
  else
    grep -q "http_status:404" "$SHARED_TUNNEL_CONFIG" \
      || die "shared config ไม่มี catch-all (http_status:404) — เพิ่ม ingress เองไม่ปลอดภัย"
    cp "$SHARED_TUNNEL_CONFIG" "${SHARED_TUNNEL_CONFIG}.bak.$(date +%s)"
    awk -v fe="$FE_HOST" -v be="$BE_HOST" -v media="$MEDIA_HOST" \
        -v fp="$FE_PORT" -v bp="$BE_PORT" -v mp="$MINIO_PORT" '
      /http_status:404/ && !ins {
        print "  - hostname: " fe;    print "    service: http://localhost:" fp
        print "  - hostname: " be;    print "    service: http://localhost:" bp
        print "  - hostname: " media; print "    service: http://localhost:" mp
        ins=1
      } { print }
    ' "$SHARED_TUNNEL_CONFIG" > "${SHARED_TUNNEL_CONFIG}.tmp" \
      && mv "${SHARED_TUNNEL_CONFIG}.tmp" "$SHARED_TUNNEL_CONFIG"
    TUNNEL_CHANGED=true
    ok "เพิ่ม ingress ticket.* เข้า shared config (backup ไว้แล้ว)"
  fi

  # route DNS for all three hosts → the shared tunnel (idempotent)
  info "ตรวจ/สร้าง DNS records → tunnel ร่วม..."
  for h in "$FE_HOST" "$BE_HOST" "$MEDIA_HOST"; do
    cloudflared tunnel route dns "$TUNNEL_REF" "$h" >>"$LOG_FILE" 2>&1 \
      && ok "DNS $h → tunnel" \
      || warn "DNS $h: อาจมีอยู่แล้ว/ชี้ tunnel อื่น — ดู $LOG_FILE"
  done
fi

# ── 3. Wire public URLs into env (BEFORE building frontend) ──────────────────
step "ตั้งค่า public URLs"
if [[ "$WITH_TUNNEL" == true && -n "$BE_HOST" ]]; then
  PUBLIC_API="https://${BE_HOST}/api"
  PUBLIC_MEDIA="https://${MEDIA_HOST}"
else
  PUBLIC_API="http://localhost:${BE_PORT}/api"
  PUBLIC_MEDIA="http://localhost:${MINIO_PORT}"
fi

# frontend: VITE_API_BASE_URL baked at build → write the production-mode override
# (.env.production.local wins over committed .env.production, and is gitignored)
cat > "$FRONTEND_DIR/.env.production.local" <<EOF
VITE_API_BASE_URL=${PUBLIC_API}
EOF
ok "frontend .env.production.local → VITE_API_BASE_URL=${PUBLIC_API}"

# backend: MINIO_PUBLIC_URL used at runtime for image URLs
if grep -q "^MINIO_PUBLIC_URL=" "$BACKEND_ENV"; then
  sed -i.bak "s|^MINIO_PUBLIC_URL=.*|MINIO_PUBLIC_URL=${PUBLIC_MEDIA}|" "$BACKEND_ENV" && rm -f "${BACKEND_ENV}.bak"
else
  echo "MINIO_PUBLIC_URL=${PUBLIC_MEDIA}" >> "$BACKEND_ENV"
fi
ok "backend MINIO_PUBLIC_URL=${PUBLIC_MEDIA} ($(basename "$BACKEND_ENV"))"

# ── 4. Build backend (deps → prisma → tsc) ───────────────────────────────────
step "Build backend"
cd "$BACKEND_DIR"
info "npm install..."; npm install --prefer-offline >>"$LOG_FILE" 2>&1 || npm install >>"$LOG_FILE" 2>&1
info "prisma generate..."; npx prisma generate >>"$LOG_FILE" 2>&1
info "prisma migrate deploy..."; npx prisma migrate deploy >>"$LOG_FILE" 2>&1 || warn "migrate deploy มี warning — ดู $LOG_FILE"
info "tsc build..."; npm run build >>"$LOG_FILE" 2>&1
[[ -f "$BACKEND_DIR/dist/server.js" ]] || die "build backend ล้มเหลว — ไม่พบ dist/server.js"
ok "backend → dist/server.js"

# ── 5. Build frontend (deps → vite build) ────────────────────────────────────
step "Build frontend"
cd "$FRONTEND_DIR"
info "npm install..."; npm install --prefer-offline >>"$LOG_FILE" 2>&1 || npm install >>"$LOG_FILE" 2>&1
info "vite build..."; npm run build >>"$LOG_FILE" 2>&1
[[ -d "$FRONTEND_DIR/dist" ]] || die "build frontend ล้มเหลว — ไม่พบ dist/"
ok "frontend → dist/"

# ── 6. Start via PM2 ─────────────────────────────────────────────────────────
step "Start services (PM2)"
cd "$SCRIPT_DIR"
# remove any old per-app tunnel from the previous (separate-tunnel) design
pm2 delete ticket-backend ticket-frontend ticket-tunnel >>"$LOG_FILE" 2>&1 || true
pm2 start ecosystem.config.cjs >>"$LOG_FILE" 2>&1
ok "ticket-backend + ticket-frontend เริ่มแล้ว"

# shared tunnel: reload the existing pos-tunnel so it picks up new ingress rules
if [[ "$WITH_TUNNEL" == true ]]; then
  if pm2 describe "$SHARED_TUNNEL_PM2" >/dev/null 2>&1; then
    if [[ "$TUNNEL_CHANGED" == true ]]; then
      info "restart $SHARED_TUNNEL_PM2 เพื่อโหลด ingress ใหม่..."
      pm2 restart "$SHARED_TUNNEL_PM2" >>"$LOG_FILE" 2>&1
    fi
    sleep 4
    pm2 show "$SHARED_TUNNEL_PM2" 2>/dev/null | grep -q "online" \
      && ok "shared tunnel ($SHARED_TUNNEL_PM2) online" \
      || warn "tunnel อาจยัง connect ไม่เสร็จ — ดู: pm2 logs $SHARED_TUNNEL_PM2"
  else
    warn "ไม่พบ PM2 process '$SHARED_TUNNEL_PM2' — รีสตาร์ท cloudflared เองเพื่อโหลด config ใหม่"
  fi
fi

pm2 save >>"$LOG_FILE" 2>&1
ok "pm2 save (reboot แล้ว restart อัตโนมัติ)"

# ── 7. Health checks ─────────────────────────────────────────────────────────
step "Health checks"
sleep 3
curl -sf "http://localhost:${BE_PORT}/api/health" &>/dev/null && ok "backend  /api/health" || warn "backend ยังไม่ตอบ — pm2 logs ticket-backend"
curl -sf "http://localhost:${FE_PORT}"            &>/dev/null && ok "frontend localhost:${FE_PORT}" || warn "frontend ยังไม่ตอบ — pm2 logs ticket-frontend"
curl -sf "http://localhost:${MINIO_PORT}/minio/health/live" &>/dev/null && ok "minio    localhost:${MINIO_PORT}" || warn "minio ยังไม่ตอบ"
if [[ "$WITH_TUNNEL" == true && -n "$BE_HOST" ]]; then
  sleep 2
  curl -sf "https://${BE_HOST}/api/health" &>/dev/null && ok "public   https://${BE_HOST}/api/health" || warn "public backend ยังไม่ตอบ (tunnel กำลัง connect)"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}${BOLD}  🚀 Hermes Bug Tracker is LIVE${RESET}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo "  Local:"
echo "    Frontend  →  http://localhost:${FE_PORT}"
echo "    Backend   →  http://localhost:${BE_PORT}/api"
echo "    MinIO     →  http://localhost:9001"
if [[ "$WITH_TUNNEL" == true && -n "$FE_HOST" ]]; then
echo ""
echo "  Public (Cloudflare Tunnel):"
echo "    Frontend  →  https://${FE_HOST}"
echo "    Backend   →  https://${BE_HOST}/api"
echo "    Media     →  https://${MEDIA_HOST}/${MINIO_BUCKET}/..."
fi
echo ""
echo "  PM2:"
echo "    pm2 status                  — ดู process"
echo "    pm2 logs ticket-backend     — log backend"
echo "    pm2 logs ticket-frontend    — log frontend"
echo "    pm2 logs ${SHARED_TUNNEL_PM2}        — log tunnel (ใช้ร่วมกับ POS)"
echo "    pm2 restart ticket-backend  — restart"
echo ""
echo "  Stop ticket: pm2 delete ticket-backend ticket-frontend"
echo "  (tunnel ${SHARED_TUNNEL_PM2} ใช้ร่วมกับ POS — อย่าลบ)"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
pm2 status 2>/dev/null | grep -E "ticket-|Name" || true
