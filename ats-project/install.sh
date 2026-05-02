#!/usr/bin/env bash
# ============================================================
#  ATS HR Custom — Script di installazione (Debian 13+)
# ============================================================
set -euo pipefail

# ── Colori ──────────────────────────────────────────────────
VERDE='\033[0;32m'; GIALLO='\033[1;33m'; ROSSO='\033[0;31m'; RESET='\033[0m'
ok()   { echo -e "${VERDE}[OK]${RESET}  $*"; }
info() { echo -e "${GIALLO}[..] $*${RESET}"; }
err()  { echo -e "${ROSSO}[ERR]${RESET} $*" >&2; exit 1; }

# ── Banner ───────────────────────────────────────────────────
echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║    ATS HR Custom — Installazione     ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# ── Root check ───────────────────────────────────────────────
[[ $EUID -ne 0 ]] && err "Esegui lo script come root: sudo bash install.sh"

# ── Directory dello script ───────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ════════════════════════════════════════════════════════════
#  STEP 1 — Parametri database (interattivo)
# ════════════════════════════════════════════════════════════
echo "  Configurazione database MySQL"
echo "  ─────────────────────────────"

read -rp "  IP / Host del database   [192.168.20.157]: " DB_HOST
DB_HOST="${DB_HOST:-192.168.20.157}"

read -rp "  Porta del database       [3306]: " DB_PORT
DB_PORT="${DB_PORT:-3306}"

read -rp "  Nome del database        [ats_database]: " DB_NAME
DB_NAME="${DB_NAME:-ats_database}"

read -rp "  Utente del database      [ats_user]: " DB_USER
DB_USER="${DB_USER:-ats_user}"

read -rsp "  Password del database:   " DB_PASSWORD
echo ""

read -rp "  Porta backend Express    [3001]: " BACKEND_PORT
BACKEND_PORT="${BACKEND_PORT:-3001}"

echo ""

# ════════════════════════════════════════════════════════════
#  STEP 2 — Aggiornamento sistema e dipendenze base
# ════════════════════════════════════════════════════════════
info "Aggiornamento pacchetti sistema…"
apt-get update -qq
apt-get install -y -qq curl git ca-certificates gnupg build-essential > /dev/null
ok "Dipendenze base installate"

# ════════════════════════════════════════════════════════════
#  STEP 3 — Node.js LTS (via NodeSource)
# ════════════════════════════════════════════════════════════
if command -v node &>/dev/null; then
  NODE_VER=$(node -v)
  ok "Node.js già installato ($NODE_VER)"
else
  info "Installazione Node.js LTS…"
  curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - > /dev/null 2>&1
  apt-get install -y -qq nodejs > /dev/null
  ok "Node.js $(node -v) installato"
fi

# ════════════════════════════════════════════════════════════
#  STEP 4 — Dipendenze backend
# ════════════════════════════════════════════════════════════
info "Installazione dipendenze backend…"
cd "$SCRIPT_DIR/backend"
npm install --omit=dev --silent
ok "Dipendenze backend installate"

# ── File .env backend ────────────────────────────────────────
cat > "$SCRIPT_DIR/backend/.env" <<EOF
PORT=${BACKEND_PORT}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
EOF
ok ".env backend creato"

# ════════════════════════════════════════════════════════════
#  STEP 5 — Build frontend
# ════════════════════════════════════════════════════════════
info "Installazione dipendenze frontend…"
cd "$SCRIPT_DIR/frontend"
npm install --silent

# .env frontend (punta al backend locale)
cat > "$SCRIPT_DIR/frontend/.env" <<EOF
VITE_API_URL=http://localhost:${BACKEND_PORT}
EOF

info "Build frontend in produzione…"
npm run build --silent
ok "Frontend compilato in frontend/dist/"

# ════════════════════════════════════════════════════════════
#  STEP 6 — Servizio systemd per il backend
# ════════════════════════════════════════════════════════════
info "Creazione servizio systemd ats-backend…"

# Determina l'utente non-root che ha chiamato sudo (o usa www-data come fallback)
RUN_USER="${SUDO_USER:-www-data}"

cat > /etc/systemd/system/ats-backend.service <<EOF
[Unit]
Description=ATS HR Custom — Backend API
After=network.target

[Service]
Type=simple
User=${RUN_USER}
WorkingDirectory=${SCRIPT_DIR}/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
EnvironmentFile=${SCRIPT_DIR}/backend/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ats-backend > /dev/null 2>&1
systemctl restart ats-backend
ok "Servizio ats-backend avviato e abilitato all'avvio"

# ════════════════════════════════════════════════════════════
#  STEP 7 — Serve frontend statico con nginx (opzionale)
# ════════════════════════════════════════════════════════════
read -rp "  Installare nginx per servire il frontend? [S/n]: " INSTALLA_NGINX
INSTALLA_NGINX="${INSTALLA_NGINX:-S}"

if [[ "$INSTALLA_NGINX" =~ ^[Ss]$ ]]; then
  info "Installazione nginx…"
  apt-get install -y -qq nginx > /dev/null

  read -rp "  Porta HTTP per il frontend [80]: " NGINX_PORT
  NGINX_PORT="${NGINX_PORT:-80}"

  cat > /etc/nginx/sites-available/ats-hr <<EOF
server {
    listen ${NGINX_PORT};
    server_name _;

    root ${SCRIPT_DIR}/frontend/dist;
    index index.html;

    # SPA: rimanda tutto a index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy verso il backend API
    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

  # Rimuove il sito default se presente
  rm -f /etc/nginx/sites-enabled/default
  ln -sf /etc/nginx/sites-available/ats-hr /etc/nginx/sites-enabled/ats-hr
  nginx -t -q && systemctl restart nginx
  ok "nginx configurato sulla porta ${NGINX_PORT}"
fi

# ════════════════════════════════════════════════════════════
#  Riepilogo finale
# ════════════════════════════════════════════════════════════
IP_LOCALE=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${VERDE}  ══════════════════════════════════════════${RESET}"
echo -e "${VERDE}   Installazione completata con successo!   ${RESET}"
echo -e "${VERDE}  ══════════════════════════════════════════${RESET}"
echo ""
echo "  Database:  ${DB_HOST}:${DB_PORT}  /  ${DB_NAME}"
echo "  Backend:   http://localhost:${BACKEND_PORT}"
if [[ "$INSTALLA_NGINX" =~ ^[Ss]$ ]]; then
  echo "  Frontend:  http://${IP_LOCALE}:${NGINX_PORT}"
fi
echo ""
echo "  Comandi utili:"
echo "    sudo systemctl status ats-backend"
echo "    sudo journalctl -u ats-backend -f"
echo ""
