# ATS HR Custom — Applicant Tracking System

SPA interna per la gestione dei candidati con board Kanban e integrazione n8n.

## Stack Tecnico

| Layer | Tecnologie |
|-------|-----------|
| Backend | Node.js, Express, mysql2, cors, dotenv |
| Frontend | React (Vite), TailwindCSS, @hello-pangea/dnd |
| Database | MySQL 8+ |
| Automazione | n8n (webhook → POST /api/candidates) |

## Struttura del Progetto

```
ats-project/
├── README.md
├── .gitignore
├── backend/
│   ├── server.js          # Entry point Express
│   ├── package.json
│   └── .env               # Variabili d'ambiente (non in git)
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   └── ...
    ├── vite.config.js
    └── package.json
```

## Variabili d'Ambiente (backend/.env)

```env
PORT=3001
DB_HOST=192.168.20.157
DB_PORT=3306
DB_NAME=ats_database
DB_USER=ats_user
DB_PASSWORD=la_tua_password
```

## Variabili d'Ambiente (frontend/.env)

```env
VITE_API_URL=http://localhost:3001
```

## Avvio

```bash
# Backend
cd backend
npm run dev

# Frontend (in un altro terminale)
cd frontend
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001

## API Endpoints

| Metodo | Percorso | Descrizione |
|--------|----------|-------------|
| GET | `/api/candidates` | Recupera tutti i candidati |
| PUT | `/api/candidates/:id/status` | Aggiorna stato Kanban |
| POST | `/api/candidates` | Inserimento da n8n (campi extra → `extra_data`) |

## Schema Database

Vedi `database/schema.sql` per lo script di creazione tabelle.
