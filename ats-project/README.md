# ATS HR Custom — Applicant Tracking System

SPA interna per la gestione dei candidati con board Kanban e integrazione n8n.

---

## Indice

1. [Stack Tecnico](#stack-tecnico)
2. [Struttura del Progetto](#struttura-del-progetto)
3. [Prerequisiti](#prerequisiti)
4. [Installazione su Debian 13](#installazione-su-debian-13)
5. [Installazione manuale (sviluppo)](#installazione-manuale-sviluppo)
6. [Variabili d'Ambiente](#variabili-dambiente)
7. [Schema Database](#schema-database)
8. [API Endpoints](#api-endpoints)
9. [Utilizzo con n8n](#utilizzo-con-n8n)

---

## Stack Tecnico

| Layer | Tecnologie |
|-------|-----------|
| Backend | Node.js, Express, mysql2, cors, dotenv |
| Frontend | React (Vite), TailwindCSS, @hello-pangea/dnd |
| Database | MySQL 8+ |
| Automazione | n8n (webhook → POST /api/candidates) |

---

## Struttura del Progetto

```
ats-project/
├── README.md
├── .gitignore
├── install.sh                 # Script installazione automatica (Debian 13)
├── database/
│   └── schema.sql             # Script creazione tabella candidates
├── backend/
│   ├── server.js              # Entry point Express + API REST
│   ├── package.json
│   └── .env                   # Variabili d'ambiente (non in git)
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   ├── api/
    │   │   └── candidati.js   # Chiamate fetch al backend
    │   └── components/
    │       ├── KanbanBoard.jsx
    │       ├── KanbanColonna.jsx
    │       ├── CandidatoCard.jsx
    │       └── DettagliModale.jsx
    ├── vite.config.js
    └── package.json
```

---

## Prerequisiti

- **Sistema operativo:** Debian 13 (o derivate Ubuntu/Debian recenti)
- **Database MySQL** già configurato e raggiungibile in rete locale
- **Tabella `candidates`** creata tramite `database/schema.sql`
- Accesso **root** o **sudo** sulla macchina di destinazione

---

## Installazione su Debian 13

Questo è il metodo consigliato per ambienti di produzione. Lo script `install.sh` automatizza tutto il processo.

### Passo 1 — Clonare il repository

```bash
git clone <url-del-repository> /opt/ats-project
cd /opt/ats-project/ats-project
```

### Passo 2 — Preparare il database

Connettersi al server MySQL ed eseguire lo script di schema:

```bash
mysql -h 192.168.20.157 -u ats_user -p ats_database < database/schema.sql
```

> Se la tabella `candidates` esiste già e deve essere ricreata, lo script esegue un `DROP TABLE IF EXISTS` in automatico.

### Passo 3 — Eseguire lo script di installazione

```bash
sudo bash install.sh
```

Lo script guida con una serie di domande interattive:

| Domanda | Valore predefinito | Note |
|---|---|---|
| IP / Host del database | `192.168.20.157` | Modifica se diverso |
| Porta del database | `3306` | |
| Nome del database | `ats_database` | |
| Utente del database | `ats_user` | |
| Password del database | *(nessuno)* | Obbligatoria |
| Porta backend Express | `3001` | |
| Installare nginx? | `S` | Consigliato per produzione |
| Porta HTTP frontend | `80` | |

### Passo 4 — Verificare i servizi

Al termine dell'installazione, verificare che tutto funzioni:

```bash
# Stato del backend
sudo systemctl status ats-backend

# Log in tempo reale del backend
sudo journalctl -u ats-backend -f
```

### Passo 5 — Aprire l'applicazione

Aprire il browser e navigare all'indirizzo IP della macchina:

```
http://<ip-della-macchina>
```

---

## Installazione manuale (sviluppo)

Per ambienti di sviluppo locali senza script automatico.

### Passo 1 — Installare Node.js LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash -
sudo apt-get install -y nodejs
```

Verificare l'installazione:

```bash
node -v   # es. v22.x.x
npm -v    # es. 10.x.x
```

### Passo 2 — Installare le dipendenze backend

```bash
cd backend
npm install
```

### Passo 3 — Configurare il file .env del backend

```bash
cp .env .env.backup   # opzionale
nano backend/.env
```

Contenuto del file (vedi sezione [Variabili d'Ambiente](#variabili-dambiente)).

### Passo 4 — Installare le dipendenze frontend

```bash
cd frontend
npm install
```

### Passo 5 — Avviare i servizi in sviluppo

Aprire due terminali separati:

```bash
# Terminale 1 — Backend
cd backend
npm run dev

# Terminale 2 — Frontend
cd frontend
npm run dev
```

### Passo 6 — Aprire l'applicazione

| Servizio | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Backend API | http://localhost:3001 |

---

## Variabili d'Ambiente

### backend/.env

```env
PORT=3001
DB_HOST=192.168.20.157
DB_PORT=3306
DB_NAME=ats_database
DB_USER=ats_user
DB_PASSWORD=la_tua_password
```

### frontend/.env

```env
VITE_API_URL=http://localhost:3001
```

> In produzione con nginx, `VITE_API_URL` può essere omesso: il proxy nginx gestisce già il reindirizzamento delle chiamate `/api/`.

---

## Schema Database

Eseguire `database/schema.sql` sul proprio server MySQL prima di avviare l'applicazione.

I campi principali della tabella `candidates`:

| Campo | Tipo | Note |
|---|---|---|
| `id` | INT UNSIGNED | Chiave primaria auto-increment |
| `first_name`, `last_name` | VARCHAR | Obbligatori |
| `email` | VARCHAR | Univoco |
| `status` | ENUM | Valori: `Nuovo`, `1° Colloquio`, `2° Colloquio`, `Offerta`, `Assunto`, `Scartato` |
| `hard_skills`, `soft_skills`, `certificazioni` | JSON | Array di valori |
| `extra_data` | JSON | Campi non mappati inviati da n8n |

---

## API Endpoints

| Metodo | Percorso | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/candidates` | Recupera tutti i candidati |
| `PUT` | `/api/candidates/:id/status` | Aggiorna lo stato Kanban |
| `PUT` | `/api/candidates/:id` | Aggiorna l'anagrafica completa |
| `POST` | `/api/candidates` | Inserimento da n8n |
| `GET` | `/api/sistema/versione` | Versione corrente e disponibilità aggiornamenti |
| `POST` | `/api/sistema/aggiorna` | Avvia aggiornamento automatico da GitHub |

---

## Utilizzo con n8n

Configurare il nodo HTTP Request di n8n con i seguenti parametri:

- **Metodo:** `POST`
- **URL:** `http://<ip-server>:3001/api/candidates`
- **Content-Type:** `application/json`

Il backend accetta qualsiasi payload JSON:
- I campi con una **colonna dedicata** nella tabella vengono salvati direttamente.
- Tutti i **campi sconosciuti** vengono automaticamente raggruppati nel campo `extra_data` (JSON) e mostrati nel modale dell'applicazione.
