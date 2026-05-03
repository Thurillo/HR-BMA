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
7. [Schema Database — Riferimento Completo](#schema-database--riferimento-completo)
8. [API Endpoints — Riferimento Completo](#api-endpoints--riferimento-completo)
9. [Integrazione n8n — Guida Dettagliata](#integrazione-n8n--guida-dettagliata)
10. [Aggiornamenti Software](#aggiornamenti-software)

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
├── VERSION                        # Versione corrente del software
├── .gitignore
├── install.sh                     # Script installazione automatica (Debian 13)
├── database/
│   └── schema.sql                 # Script creazione tabella candidates
├── backend/
│   ├── server.js                  # Entry point Express + API REST
│   ├── routes/
│   │   └── sistema.js             # Route aggiornamento software
│   ├── package.json
│   └── .env                       # Variabili d'ambiente (non in git)
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   ├── api/
    │   │   └── candidati.js       # Chiamate fetch al backend
    │   └── components/
    │       ├── KanbanBoard.jsx
    │       ├── KanbanColonna.jsx
    │       ├── CandidatoCard.jsx
    │       ├── DettagliModale.jsx
    │       └── BadgeAggiornamento.jsx
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

### Passo 1 — Clonare il repository

```bash
git clone <url-del-repository> /opt/ats-project
cd /opt/ats-project/ats-project
```

### Passo 2 — Preparare il database

```bash
mysql -h 192.168.20.157 -u ats_user -p ats_database < database/schema.sql
```

> Lo script esegue un `DROP TABLE IF EXISTS` prima della creazione — non eseguirlo su una tabella con dati reali senza backup.

### Passo 3 — Eseguire lo script di installazione

```bash
sudo bash install.sh
```

Lo script richiede in modo interattivo:

| Parametro | Predefinito | Note |
|---|---|---|
| IP / Host del database | `192.168.20.157` | |
| Porta del database | `3306` | |
| Nome del database | `ats_database` | |
| Utente del database | `ats_user` | |
| Password del database | *(nessuno)* | Obbligatoria |
| Porta backend Express | `3001` | |
| Installare nginx? | `S` | Consigliato per produzione |
| Porta HTTP frontend | `80` | |

### Passo 4 — Verificare i servizi

```bash
sudo systemctl status ats-backend
sudo journalctl -u ats-backend -f
```

### Passo 5 — Aprire l'applicazione

```
http://<ip-della-macchina>
```

---

## Installazione manuale (sviluppo)

### Passo 1 — Installare Node.js LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash -
sudo apt-get install -y nodejs
```

### Passo 2 — Backend

```bash
cd backend
npm install
# Creare e compilare il file .env (vedi sezione Variabili d'Ambiente)
npm run dev
```

### Passo 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

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

> In produzione con nginx, `VITE_API_URL` può essere omesso: il proxy nginx gestisce il reindirizzamento di `/api/`.

---

## Schema Database — Riferimento Completo

Eseguire nell'ordine: prima `database/schema.sql`, poi `database/schema_posizioni.sql`.

### Tabella `positions`

| Campo | Tipo | Obbligatorio | Note |
|---|---|---|---|
| `id` | `INT UNSIGNED` | — | PK auto-increment |
| `titolo` | `VARCHAR(255)` | **Sì** | Nome della posizione lavorativa |
| `descrizione` | `TEXT` | No | Descrizione estesa |
| `stato` | `ENUM` | Sì | `Aperta`, `In pausa`, `Chiusa` — default: `Aperta` |
| `created_at` | `TIMESTAMP` | — | Auto |
| `updated_at` | `TIMESTAMP` | — | Auto |

### Tabella `position_candidates` (associazione)

| Campo | Tipo | Note |
|---|---|---|
| `position_id` | `INT UNSIGNED` | FK → `positions.id` (CASCADE DELETE) |
| `candidate_id` | `INT UNSIGNED` | FK → `candidates.id` (CASCADE DELETE) |
| `created_at` | `TIMESTAMP` | Auto |

La chiave primaria è composta `(position_id, candidate_id)` — un candidato non può essere aggiunto due volte alla stessa posizione.

---

### Tabella `candidates` — Engine: InnoDB — Charset: `utf8mb4_unicode_ci`

### Campi Anagrafici Base

| Campo | Tipo MySQL | Obbligatorio | Max caratteri | Note |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | — | — | Chiave primaria, auto-increment, generato dal sistema |
| `first_name` | `VARCHAR(100)` | **Sì** | 100 | Nome del candidato |
| `last_name` | `VARCHAR(100)` | **Sì** | 100 | Cognome del candidato |
| `email` | `VARCHAR(255)` | No | 255 | Deve essere **univoca** — inserimento rifiutato se già presente (HTTP 409) |
| `phone` | `VARCHAR(50)` | No | 50 | Numero di telefono in formato libero (es. `+39 02 1234567`) |
| `location` | `VARCHAR(255)` | No | 255 | Città, provincia o indirizzo (es. `Milano, MI`) |
| `current_role` | `VARCHAR(255)` | No | 255 | Titolo professionale attuale (es. `Senior Backend Developer`) |
| `years_experience` | `DECIMAL(4,1)` | No | — | Anni di esperienza con un decimale (es. `5.0`, `12.5`). Valore massimo: `999.9` |
| `max_education` | `VARCHAR(255)` | No | 255 | Titolo di studio più alto (es. `Laurea Magistrale in Informatica`) |
| `executive_summary` | `TEXT` | No | ~65.535 byte | Sintesi professionale estesa. Non ha limite pratico di lunghezza |
| `file_path_smb` | `VARCHAR(500)` | No | 500 | Percorso UNC del CV sulla rete SMB (es. `\\\\server\\cv\\rossi_mario.pdf`) |

### Campi Profilo Esteso

| Campo | Tipo MySQL | Obbligatorio | Max caratteri | Note |
|---|---|---|---|---|
| `linkedin_url` | `VARCHAR(255)` | No | 255 | URL completo del profilo LinkedIn (es. `https://linkedin.com/in/mario-rossi`) |
| `portfolio_url` | `VARCHAR(255)` | No | 255 | URL del portfolio o sito personale |
| `seniority` | `VARCHAR(50)` | No | 50 | Livello di seniority (es. `Junior`, `Mid`, `Senior`, `Lead`, `C-Level`) |
| `settore_prevalente` | `VARCHAR(150)` | No | 150 | Settore di provenienza principale (es. `Fintech`, `Healthcare`, `E-commerce`) |
| `hard_skills` | `JSON` | No | — | Array JSON di competenze tecniche. Deve essere un array di stringhe: `["Python","SQL","Docker"]` |
| `soft_skills` | `JSON` | No | — | Array JSON di competenze trasversali: `["Leadership","Problem Solving","Team Work"]` |
| `ambito_studi` | `VARCHAR(150)` | No | 150 | Ambito disciplinare degli studi (es. `Ingegneria Informatica`, `Economia`) |
| `universita` | `VARCHAR(150)` | No | 150 | Nome dell'ateneo (es. `Politecnico di Milano`) |
| `certificazioni` | `JSON` | No | — | Array JSON di certificazioni conseguite: `["AWS Solutions Architect","PMP","CISSP"]` |
| `preavviso` | `VARCHAR(50)` | No | 50 | Periodo di preavviso contrattuale (es. `30 giorni`, `3 mesi`, `Immediato`) |
| `ral_indicata` | `VARCHAR(50)` | No | 50 | Retribuzione annua lorda indicata o attesa (es. `45.000€`, `45-50k`) |
| `modalita_lavoro` | `VARCHAR(50)` | No | 50 | Preferenza modalità lavorativa (es. `Full Remote`, `Ibrido`, `In presenza`) |

### Campi di Logica Applicativa

| Campo | Tipo MySQL | Obbligatorio | Valori ammessi | Note |
|---|---|---|---|---|
| `status` | `ENUM` | **Sì** | `Nuovo`, `1° Colloquio`, `2° Colloquio`, `Offerta`, `Assunto`, `Scartato` | Predefinito: `Nuovo`. Gestisce la colonna Kanban. Valori con caratteri speciali vanno inviati esattamente come indicato (incluso `°`) |
| `macro_sector` | `VARCHAR(150)` | No | 150 | Macro-categoria del settore (es. `IT`, `Finance`, `Marketing`, `Operations`) |

### Campi di Sistema

| Campo | Tipo MySQL | Note |
|---|---|---|
| `extra_data` | `JSON` | Oggetto JSON con tutti i campi non mappati inviati da n8n. Popolato automaticamente dal backend — non inviare questo campo direttamente |
| `created_at` | `TIMESTAMP` | Data/ora di inserimento. Generata automaticamente dal DB |
| `updated_at` | `TIMESTAMP` | Data/ora dell'ultimo aggiornamento. Aggiornata automaticamente ad ogni modifica |

### Indici e Vincoli

| Tipo | Campo/i | Comportamento |
|---|---|---|
| `PRIMARY KEY` | `id` | Identificatore univoco per ogni record |
| `UNIQUE KEY` | `email` | Due candidati non possono avere la stessa email. Il backend risponde con HTTP `409 Conflict` in caso di duplicato |
| `INDEX` | `status` | Ottimizza il filtraggio per colonna Kanban |
| `INDEX` | `macro_sector` | Ottimizza il filtraggio per settore |

---

## API Endpoints — Riferimento Completo

Base URL: `http://<ip-server>:3001`

### Riepilogo

| Metodo | Percorso | Descrizione |
|---|---|---|
| `GET` | `/api/candidates` | Recupera tutti i candidati |
| `PUT` | `/api/candidates/:id/status` | Aggiorna stato Kanban |
| `PUT` | `/api/candidates/:id` | Aggiorna anagrafica completa |
| `POST` | `/api/candidates` | Inserimento da n8n |
| `GET` | `/api/posizioni` | Lista posizioni (con conteggio candidati) |
| `POST` | `/api/posizioni` | Crea nuova posizione |
| `PUT` | `/api/posizioni/:id` | Modifica posizione |
| `DELETE` | `/api/posizioni/:id` | Elimina posizione |
| `GET` | `/api/posizioni/:id/candidati` | Candidati associati |
| `POST` | `/api/posizioni/:id/candidati` | Associa candidato |
| `DELETE` | `/api/posizioni/:id/candidati/:cid` | Rimuove associazione |
| `GET` | `/api/sistema/versione` | Verifica aggiornamenti |
| `POST` | `/api/sistema/aggiorna` | Avvia aggiornamento |

---

### `GET /api/candidates`

Recupera tutti i candidati presenti nel database, ordinati per data di inserimento decrescente.

**Richiesta**

```
GET /api/candidates
```

Nessun parametro richiesto.

**Risposta — 200 OK**

Array di oggetti candidato. I campi JSON (`hard_skills`, `soft_skills`, `certificazioni`, `extra_data`) sono restituiti già deserializzati come array/oggetti JavaScript.

```json
[
  {
    "id": 1,
    "first_name": "Mario",
    "last_name": "Rossi",
    "email": "mario.rossi@email.com",
    "status": "Nuovo",
    "hard_skills": ["Python", "SQL", "Docker"],
    "extra_data": { "fonte": "LinkedIn", "valutazione_ai": "Alta" },
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T10:30:00.000Z"
  }
]
```

---

### `POST /api/candidates`

Inserisce un nuovo candidato. Endpoint pensato per essere chiamato da **n8n** al termine dell'estrazione AI da CV.

**Richiesta**

```
POST /api/candidates
Content-Type: application/json
```

Il backend separa automaticamente i campi del payload:
- I campi con una **colonna dedicata** nella tabella vengono salvati direttamente.
- Tutti i **campi sconosciuti** (non presenti nella tabella) vengono raggruppati nell'oggetto `extra_data`.

**Body — esempio completo**

```json
{
  "first_name": "Mario",
  "last_name": "Rossi",
  "email": "mario.rossi@email.com",
  "phone": "+39 333 1234567",
  "location": "Milano, MI",
  "current_role": "Backend Developer",
  "years_experience": 7.0,
  "max_education": "Laurea Magistrale in Informatica",
  "executive_summary": "Sviluppatore backend con 7 anni di esperienza in ambito fintech...",
  "file_path_smb": "\\\\server\\cv\\mario_rossi.pdf",
  "linkedin_url": "https://linkedin.com/in/mario-rossi",
  "portfolio_url": "https://mariorossi.dev",
  "seniority": "Senior",
  "settore_prevalente": "Fintech",
  "hard_skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes"],
  "soft_skills": ["Problem Solving", "Team Work", "Comunicazione"],
  "ambito_studi": "Ingegneria Informatica",
  "universita": "Politecnico di Milano",
  "certificazioni": ["AWS Solutions Architect", "Kubernetes CKA"],
  "preavviso": "30 giorni",
  "ral_indicata": "55.000€",
  "modalita_lavoro": "Ibrido",
  "macro_sector": "IT"
}
```

> I campi `status` e `extra_data` non devono essere inviati: `status` viene impostato automaticamente a `Nuovo`, `extra_data` viene popolato dal backend con i campi non riconosciuti.

**Campi aggiuntivi (finiscono in `extra_data`)**

Qualsiasi campo non presente nella tabella viene accettato e salvato in `extra_data`. Esempio:

```json
{
  "first_name": "Mario",
  "last_name": "Rossi",
  "fonte_candidatura": "LinkedIn",
  "valutazione_ai": "Alta",
  "note_recruiter": "Candidato molto interessante"
}
```

Risultato in `extra_data`:
```json
{
  "fonte_candidatura": "LinkedIn",
  "valutazione_ai": "Alta",
  "note_recruiter": "Candidato molto interessante"
}
```

**Risposte**

| Codice | Significato |
|---|---|
| `201 Created` | Candidato inserito. Risposta: `{ "messaggio": "...", "id": 42 }` |
| `400 Bad Request` | Payload vuoto o privo di campi validi |
| `409 Conflict` | Email già presente nel database |
| `500 Internal Server Error` | Errore del database |

---

### `PUT /api/candidates/:id/status`

Aggiorna unicamente il campo `status` di un candidato. Chiamato automaticamente dal frontend al drag & drop sulla board Kanban.

**Richiesta**

```
PUT /api/candidates/42/status
Content-Type: application/json
```

```json
{
  "status": "1° Colloquio"
}
```

**Valori ammessi per `status`**

```
Nuovo | 1° Colloquio | 2° Colloquio | Offerta | Assunto | Scartato
```

> Attenzione: il carattere `°` è parte integrante del valore. Inviare la stringa esattamente come indicata.

**Risposte**

| Codice | Significato |
|---|---|
| `200 OK` | Stato aggiornato. Risposta: `{ "messaggio": "Stato aggiornato con successo" }` |
| `400 Bad Request` | Valore di `status` non valido o assente |
| `404 Not Found` | Nessun candidato trovato con quell'`id` |
| `500 Internal Server Error` | Errore del database |

---

### `PUT /api/candidates/:id`

Aggiorna uno o più campi dell'anagrafica completa di un candidato. Chiamato dal frontend al salvataggio del form di modifica.

**Richiesta**

```
PUT /api/candidates/42
Content-Type: application/json
```

Inviare solo i campi da aggiornare. I campi non inclusi nel body non vengono modificati.

```json
{
  "current_role": "Lead Backend Developer",
  "ral_indicata": "65.000€",
  "status": "Offerta",
  "hard_skills": ["Python", "FastAPI", "PostgreSQL", "Kafka"]
}
```

> I campi `id`, `created_at` e `updated_at` vengono ignorati anche se inclusi nel body.

**Risposta — 200 OK**

Il backend restituisce il record completo e aggiornato:

```json
{
  "id": 42,
  "first_name": "Mario",
  "last_name": "Rossi",
  "current_role": "Lead Backend Developer",
  "ral_indicata": "65.000€",
  "status": "Offerta",
  "hard_skills": ["Python", "FastAPI", "PostgreSQL", "Kafka"],
  "updated_at": "2025-01-20T14:22:00.000Z"
}
```

**Risposte**

| Codice | Significato |
|---|---|
| `200 OK` | Anagrafica aggiornata, restituisce il record completo |
| `400 Bad Request` | Nessun campo valido incluso nel body |
| `404 Not Found` | Nessun candidato trovato con quell'`id` |
| `409 Conflict` | Email già in uso da un altro candidato |
| `500 Internal Server Error` | Errore del database |

---

### `GET /api/sistema/versione`

Verifica se è disponibile un aggiornamento software confrontando il commit locale con il branch `main` su GitHub.

**Risposta — 200 OK**

```json
{
  "versione": "1.0.0",
  "branch_locale": "main",
  "branch_aggiornamento": "main",
  "commit_locale": "3c2cab6",
  "commit_remoto": "0ac6cee",
  "aggiornamento_disponibile": true
}
```

---

### `POST /api/sistema/aggiorna`

Avvia l'aggiornamento automatico del software. Il server risponde immediatamente, poi esegue in background:

1. `git fetch origin main`
2. `git checkout main`
3. `git reset --hard origin/main`
4. `npm install` (backend)
5. `npm run build` (frontend)
6. `systemctl restart ats-backend`

```
POST /api/sistema/aggiorna
```

**Risposta — 200 OK**

```json
{
  "messaggio": "Aggiornamento avviato. Il servizio si riavvierà a breve."
}
```

> Il frontend attende il riavvio del backend (max 60 secondi) e ricarica automaticamente la pagina.

---

## Integrazione n8n — Guida Dettagliata

### Configurazione del nodo HTTP Request

Nel workflow n8n, dopo il nodo di estrazione AI dal CV, aggiungere un nodo **HTTP Request** con i seguenti parametri:

| Parametro | Valore |
|---|---|
| **Metodo** | `POST` |
| **URL** | `http://<ip-server>:3001/api/candidates` |
| **Authentication** | None |
| **Content Type** | `JSON` |
| **Body** | Specificare i campi (vedi sotto) |

---

### Mappatura campi AI → API

La tabella seguente mostra come mappare l'output tipico di un modello AI di estrazione CV ai campi dell'API.

| Campo API | Tipo atteso | Esempio di valore | Note per il mapping in n8n |
|---|---|---|---|
| `first_name` | Stringa | `"Mario"` | Obbligatorio |
| `last_name` | Stringa | `"Rossi"` | Obbligatorio |
| `email` | Stringa | `"mario@email.com"` | Se vuoto o duplicato il record viene scartato (409) |
| `phone` | Stringa | `"+39 333 1234567"` | Formato libero |
| `location` | Stringa | `"Milano, MI"` | |
| `current_role` | Stringa | `"Backend Developer"` | |
| `years_experience` | Numero | `7.5` | Usare `parseFloat()` in n8n se l'AI restituisce una stringa |
| `max_education` | Stringa | `"Laurea Magistrale"` | |
| `executive_summary` | Stringa | `"Sviluppatore con..."` | Può essere molto lungo, nessun limite pratico |
| `file_path_smb` | Stringa | `"\\\\srv\\cv\\file.pdf"` | I backslash vanno raddoppiati nel JSON |
| `linkedin_url` | Stringa | `"https://linkedin.com/in/..."` | |
| `portfolio_url` | Stringa | `"https://..."` | |
| `seniority` | Stringa | `"Senior"` | Valore libero |
| `settore_prevalente` | Stringa | `"Fintech"` | |
| `hard_skills` | Array di stringhe | `["Python","SQL"]` | Se l'AI restituisce una stringa separata da virgole, usare il nodo **Code** per convertirla: `skills.split(',').map(s => s.trim())` |
| `soft_skills` | Array di stringhe | `["Leadership"]` | Come sopra |
| `ambito_studi` | Stringa | `"Informatica"` | |
| `universita` | Stringa | `"Polimi"` | |
| `certificazioni` | Array di stringhe | `["AWS SAA","PMP"]` | Come sopra per la conversione |
| `preavviso` | Stringa | `"30 giorni"` | |
| `ral_indicata` | Stringa | `"45.000€"` | Trattato come testo, non numero |
| `modalita_lavoro` | Stringa | `"Ibrido"` | |
| `macro_sector` | Stringa | `"IT"` | |

---

### Gestione degli array in n8n

I campi `hard_skills`, `soft_skills` e `certificazioni` devono essere inviati come **array JSON**, non come stringhe.

Se il modello AI restituisce una stringa del tipo `"Python, SQL, Docker"`, inserire un nodo **Code** prima dell'HTTP Request:

```javascript
// Nodo Code — conversione stringhe in array
const item = $input.first().json;

const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return val.split(',').map(s => s.trim()).filter(Boolean);
};

return [{
  json: {
    ...item,
    hard_skills:   toArray(item.hard_skills),
    soft_skills:   toArray(item.soft_skills),
    certificazioni: toArray(item.certificazioni),
  }
}];
```

---

### Gestione dei duplicati in n8n

Quando l'API risponde con **HTTP 409** significa che il candidato è già presente (stessa email). Per gestirlo nel workflow:

1. Dopo il nodo HTTP Request, aggiungere un nodo **IF**
2. Condizione: `{{ $json.statusCode }} === 409`
3. Ramo **true** → aggiornare il candidato esistente con `PUT /api/candidates/:id`
4. Ramo **false** → proseguire normalmente

---

### Esempio payload completo per n8n

```json
{
  "first_name": "Anna",
  "last_name": "Bianchi",
  "email": "anna.bianchi@email.com",
  "phone": "+39 02 9876543",
  "location": "Roma, RM",
  "current_role": "UX Designer",
  "years_experience": 4.0,
  "max_education": "Laurea Triennale in Design della Comunicazione",
  "executive_summary": "Designer con focus su user research e prototipazione...",
  "linkedin_url": "https://linkedin.com/in/anna-bianchi",
  "seniority": "Mid",
  "settore_prevalente": "Digital Agency",
  "hard_skills": ["Figma", "Adobe XD", "Sketch", "HTML/CSS"],
  "soft_skills": ["Creatività", "Empatia", "Comunicazione"],
  "ambito_studi": "Design",
  "universita": "IUAV Venezia",
  "certificazioni": ["Google UX Design Certificate"],
  "preavviso": "Immediato",
  "ral_indicata": "35.000€",
  "modalita_lavoro": "Full Remote",
  "macro_sector": "Design",
  "fonte_cv": "Indeed",
  "punteggio_ai": "87/100",
  "lingua_cv": "Italiano"
}
```

> I campi `fonte_cv`, `punteggio_ai` e `lingua_cv` non hanno una colonna dedicata: vengono salvati automaticamente in `extra_data` e visualizzati nel modale dell'applicazione nella sezione "Dati aggiuntivi (n8n)".

---

## Aggiornamenti Software

Il pulsante **Controlla versione** nell'header dell'applicazione confronta il codice installato con il branch `main` su GitHub.

- Se il software è aggiornato → indicatore verde
- Se è disponibile una nuova versione → banner blu con i codici commit e pulsante **Aggiorna ora**

L'aggiornamento è completamente automatico: pull del codice, reinstallazione dipendenze, rebuild del frontend e riavvio del servizio. La pagina si ricarica automaticamente al termine.
