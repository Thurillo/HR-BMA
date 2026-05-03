#!/usr/bin/env bash
# ============================================================
#  ATS HR Custom — Script di aggiornamento
#  Aggiorna il software all'ultima versione dal branch main
#  senza richiedere i dati di configurazione.
#  Uso: sudo bash upgrade.sh
# ============================================================
set -euo pipefail

VERDE='\033[0;32m'; GIALLO='\033[1;33m'; ROSSO='\033[0;31m'; RESET='\033[0m'
ok()   { echo -e "${VERDE}[OK]${RESET}  $*"; }
info() { echo -e "${GIALLO}[..] $*${RESET}"; }
err()  { echo -e "${ROSSO}[ERR]${RESET} $*" >&2; exit 1; }

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║    ATS HR Custom — Aggiornamento     ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

[[ $EUID -ne 0 ]] && err "Esegui lo script come root: sudo bash upgrade.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANCH="main"

# ── Verifica prerequisiti ─────────────────────────────────────────────────────
command -v git  &>/dev/null || err "git non trovato"
command -v node &>/dev/null || err "Node.js non trovato — esegui prima install.sh"
command -v npm  &>/dev/null || err "npm non trovato"

# ── Fix safe.directory (necessario se il servizio gira con utente diverso) ───
git config --global --add safe.directory "$SCRIPT_DIR" 2>/dev/null || true

# ── Recupera aggiornamenti da GitHub ─────────────────────────────────────────
info "Recupero aggiornamenti da GitHub (branch: ${BRANCH})…"
cd "$SCRIPT_DIR"
git -c safe.directory=* fetch origin "$BRANCH" --quiet
COMMIT_LOCALE=$(git -c safe.directory=* rev-parse HEAD | cut -c1-7)
COMMIT_REMOTO=$(git -c safe.directory=* rev-parse "origin/${BRANCH}" | cut -c1-7)

if [[ "$COMMIT_LOCALE" == "$COMMIT_REMOTO" ]]; then
  ok "Il software è già aggiornato (commit: ${COMMIT_LOCALE})"
  echo ""
  exit 0
fi

echo "  Aggiornamento: ${COMMIT_LOCALE} → ${COMMIT_REMOTO}"
echo ""

# ── Applica aggiornamenti ─────────────────────────────────────────────────────
info "Applicazione aggiornamenti…"
git -c safe.directory=* checkout "$BRANCH"
git -c safe.directory=* reset --hard "origin/${BRANCH}"
ok "Codice aggiornato"

# ── Dipendenze backend ────────────────────────────────────────────────────────
info "Aggiornamento dipendenze backend…"
npm install --omit=dev --silent --prefix "$SCRIPT_DIR/backend"
ok "Dipendenze backend aggiornate"

# ── Build frontend ────────────────────────────────────────────────────────────
info "Build frontend in produzione…"
npm install --silent --prefix "$SCRIPT_DIR/frontend"

# Mantieni VITE_API_URL vuoto per il proxy nginx
cat > "$SCRIPT_DIR/frontend/.env" <<'ENVEOF'
VITE_API_URL=
ENVEOF

NODE_ENV=production npm run build --silent --prefix "$SCRIPT_DIR/frontend"
ok "Frontend compilato"

# ── Riavvio servizio ──────────────────────────────────────────────────────────
info "Riavvio servizio ats-backend…"
if systemctl is-active --quiet ats-backend; then
  systemctl restart ats-backend
  ok "Servizio riavviato"
else
  systemctl start ats-backend
  ok "Servizio avviato"
fi

# ── Ricarica nginx (se attivo) ────────────────────────────────────────────────
if systemctl is-active --quiet nginx; then
  systemctl reload nginx
  ok "nginx ricaricato"
fi

# ── Riepilogo ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${VERDE}  ══════════════════════════════════════${RESET}"
echo -e "${VERDE}   Aggiornamento completato con successo ${RESET}"
echo -e "${VERDE}  ══════════════════════════════════════${RESET}"
echo ""
echo "  Versione precedente: ${COMMIT_LOCALE}"
echo "  Versione attuale:    ${COMMIT_REMOTO}"
echo ""
