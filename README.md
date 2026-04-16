# StructaIQ / Structal Q Platform

Integrated academic evaluation system for **lecturers** and **students**: submissions, marking guides, AI-assisted analysis, lecturer validation, marks publishing, concerns, evaluation scheduling, and exam timetables. **No admin module** and **no email delivery** (in-app status only).

---

## Architecture

| Layer | Path | Technology |
|--------|------|------------|
| Web UI | `frontend/web-app-new/` | React (Create React App), Tailwind-style utility classes |
| API | `backend/node-api/` | Node.js, Express, JWT, `mssql` |
| AI / ML | `backend/python-ml/` | FastAPI, evaluation and similarity pipelines |
| Database scripts | `databse/` | MSSQL schema (`alltables.sql`, etc.) |
| File storage | `backend/node-api/storage/`, repo `storage/` | PDF/DOCX on disk; paths in `file_storage` |

**Request flow:** React → Express (`/api/*`) → MSSQL; AI calls go Express → FastAPI (`ML_SERVICE_URL`).

---

## Core modules

1. **Submissions** — Upload PDF/DOCX, attempts, late/grace handling (`/api/submissions`).
2. **Marking guides** — Upload and versioning (`/api/marking-guides`, lecturer UI `MarkingGuideManagement.jsx`).
3. **AI analysis** — `/evaluate`, compare, persistence in `analysis_result` (`/api/ai-analysis`).
4. **Marks** — Publish/revision, student view, PDF where implemented (`/api/marks`, `/api/student/marks`).
5. **Concerns** — Student raise, lecturer respond (`/api/concerns`).
6. **Evaluation scheduling** — Slots, groups, publish (`/api/evaluation-scheduling`).
7. **Exam timetable** — Sessions, rooms, draft/publish (`/api/timetable`).

---

## Repository layout (main)

```
Structal_Q-platform/
├── backend/node-api/src/
│   ├── app.js                 # Express app, /api mount, CORS, session, errors
│   ├── server.js              # DB connect, listen, concern window scheduler
│   ├── routes/index.js        # JWT-protected API routes
│   └── modules/               # subject, assessment, marking-guide, submission,
│                              # ai-analysis, concern, mark-publish, timetable, …
├── backend/python-ml/app/     # FastAPI app, pipelines, diagram helpers
├── frontend/web-app-new/src/
│   ├── App.js                 # Routes (lecturer + student)
│   └── pages/                 # Dashboards, submissions, marks, concerns, …
├── databse/                   # SQL scripts
└── README.md
```

Legacy/alternate UI: `frontend/web-app/my-app/` (timetable-focused; primary app is `web-app-new`).

---

## Prerequisites

- Node.js 18+
- Python 3.10+ (for FastAPI service)
- Microsoft SQL Server (instance configured in `.env`)
- Optional: `pdfkit` for concern PDF export (install in `backend/node-api` if export is used)

---

## Environment variables

### Backend (`backend/node-api/.env`)

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default `5000`) |
| `DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MSSQL connection (see `src/config/db.js`) |
| `JWT_SECRET`, `JWT_EXPIRE` | JWT signing |
| `SESSION_SECRET` | Express session |
| `ML_SERVICE_URL` | FastAPI base URL (e.g. `http://127.0.0.1:8000`) |

Email-related vars are **ignored for delivery**; `sendEmail` is a no-op in this version.

### Frontend (`frontend/web-app-new/.env`)

| Variable | Purpose |
|----------|---------|
| `REACT_APP_API_URL` | API origin; use empty string with CRA **proxy** to same host, or `http://localhost:5000` |

Example:

```env
REACT_APP_API_URL=
```

(Create React App reads `REACT_APP_*` at build time.)

### Python (`backend/python-ml`)

Use `requirements.txt`; set any ports/hosts expected by `app/main.py` and call the same `ML_SERVICE_URL` as Node.

---

## Run locally

### 1. Database

Apply or sync scripts under `databse/` to your MSSQL instance (preserve existing data; use incremental scripts in production).

### 2. FastAPI (AI)

```bash
cd backend/python-ml
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Ensure `ML_SERVICE_URL` in Node matches this URL.

### 3. Node API

```bash
cd backend/node-api
npm install
npm start
```

### 4. React (primary UI)

```bash
cd frontend/web-app-new
npm install
npm start
```

CRA dev server proxies API calls when `package.json` contains `"proxy": "http://localhost:5000"` and `REACT_APP_API_URL` is empty.

---

## Authentication

- **Login:** `POST /api/auth/login` returns JWT + user payload.
- **Session:** `GET /api/auth/session` with `Authorization: Bearer <token>`.
- **Storage:** Client keeps `auth_token` and `auth_user` in `localStorage` (for lecturer id on concern responses).
- **Roles:** `lecturer`, `student` (JWT `role`). Routes under `routes/index.js` use `verifyToken`.

---

## Main workflows

1. Lecturer creates subject/offering/assessment and uploads a **marking guide** (PDF/DOCX).
2. Student uploads submissions (`/student/submissions` → `POST /api/submissions/upload`).
3. Lecturer runs **AI evaluate** (`/lecturer/ml-portal`: guide + submission → `POST /api/ai-analysis/analyze`). AI does **not** auto-publish final marks.
4. Lecturer reviews results, sets marks, **publishes** when ready.
5. Student views published marks; may raise a **concern** within the concern window; lecturer **responds** in app (no email).

---

## AI analysis (summary)

- Node forwards files to FastAPI `/evaluate` with `student_file` and `guide_file` paths.
- Results are stored in MSSQL (`analysis_result`, `ai_question_score`, etc.).
- **Diagram** handling is implemented in Python (`diagram_validator.py`, `diagram_extractor.py`); tuning may continue for accuracy.

---

## Implementation notes

- **File hashing:** `sha256_hash` / `integrity_hash` are optional and stored as `NULL` where not used.
- **Duplicate API mounting** was removed from `server.js`; all secured routes go through `app.js` → `routes/index.js`.
- **Concerns API** base path: **`/api/concerns`** (plural).
- **Email:** SMTP is not used for user-facing workflows; `emailService.sendEmail` logs and returns without sending.

---

## Known limitations

- Jest integration tests may require optional deps (e.g. `pdfkit`) and a live DB; run in CI with mocks or install missing packages.
- Some legacy pages (`frontend/web-app`) are not the primary UI.
- AI quality depends on models, OCR, and document structure.

---

## Future improvements

- Stronger role checks per route (lecturer vs student).
- Automated DB migrations (versioned scripts).
- Optional real email behind a feature flag (currently off by design).

---

## Authors / course context

Built as an academic group project (Year 2 – Software Engineering style scope). This README reflects the **integrated** codebase in this repository.
