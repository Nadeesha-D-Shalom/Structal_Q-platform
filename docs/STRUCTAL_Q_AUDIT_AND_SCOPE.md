# StructaL Q Platform — Audit & Scope (Web)

**Product:** Student Lab Submission Management (React web app: `frontend/web-app-new`).  
**Stack:** Node/Express API (`backend/node-api`), MS SQL Server, Python FastAPI ML (assistive only).  
**Out of scope:** React Native / mobile app (not maintained here).

## 1. Existing modules (backend)

| Area | Path |
|------|------|
| Auth | `modules/auth` |
| Subjects + offerings | `modules/subject` — `GET/POST /api/subjects/offerings` |
| Assessments / student labs | `modules/assessment` — includes `GET /api/assessments/student/labs` |
| Submissions + uploads | `modules/submission` |
| Marks publish + concern windows + CSV | `modules/mark-publish` — `POST /api/marks/publish` opens `concern_window` (48h) |
| Student marks view | `modules/mark-publish/viewMarks` — mounted at `/api/student/marks` |
| Concerns (structured) | `modules/concern` — `POST /api/concerns` (validates concern window) |
| AI analysis | `modules/ai-analysis` |
| Mark comparison | `modules/mark-comparison` |
| Dashboard summaries | `modules/dashboard` |
| Groups | `modules/group` |
| Notifications | `modules/notification` — `/api/notifications` |
| Evaluation scheduling | `modules/evaluation-scheduling` — publish triggers in-app notifications |
| Exam timetable | `modules/timetable` — publish triggers broadcast student notifications |

## 2. Core workflows (implemented behaviour)

- **Marks publish:** `bulkPublishMarks` inserts `final_mark` (PUBLISHED), ensures `concern_window` per assessment, notifies students (marks + concern window), optional scheduler closes rows when `status` + `open_until` exist.
- **Concerns:** Students post via `/api/concerns`; eligibility uses `concern_window` if present, else 48h from `published_at`.
- **Notifications:** Types include `MARKS_PUBLISHED`, `CONCERN_WINDOW_OPENED`, `EVALUATION_SCHEDULE_PUBLISHED`, `EXAM_TIMETABLE_PUBLISHED`, `ASSIGNMENT_CREATED` (broadcast opt-in via `NOTIFY_STUDENTS_ON_ASSIGNMENT=true`).

## 3. Database

- Canonical reference scripts: `databse/SQLQuery2.sql`, `databse/alltables.sql`, migrations under `backend/node-api/sql/migrations/`.
- If `notification` inserts fail on FK, run `003_notification_fk_users_optional.sql`.

## 4. Deprecated / isolated

- `frontend/web-app/` — legacy; see `DEPRECATED.txt`. Use `web-app-new` only.

## 5. Recommended next hardening (optional)

- Enrollment-scoped assignment notifications (instead of broadcast).
- Align `final_mark` workflow strictly to DRAFT → VALIDATED → PUBLISHED if the UI still bypasses VALIDATED.
