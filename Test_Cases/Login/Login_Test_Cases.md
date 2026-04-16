# Login Module — Test Documentation

**Scope:** `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout`, React `LoginPage.jsx`, JWT storage (`auth_token`, `auth_user`).

**Out of scope (per project instruction):** Admin-only flows, email OTP.

---

## Test case file

| File | Description |
|------|-------------|
| `Login_Test_Cases.csv` | Excel-ready; columns include automation + test level |

---

## Coverage map

| Area | TC IDs | Priority |
|------|--------|----------|
| Happy path lecturer/student | TC_AUTH_001–002 | P1 |
| Invalid credentials / unknown user | TC_AUTH_003–004 | P1 |
| Empty / validation | TC_AUTH_005–007 | P2 |
| Token & session API | TC_AUTH_008–014 | P1 |
| Token tamper / expiry | TC_AUTH_012–013 | P1 |
| Security (SQLi, XSS) | TC_AUTH_017–018 | P1–P2 |
| Edge (inactive user, concurrent) | TC_AUTH_016, 020–021 | P2–P3 |

---

## Automation suggestions

- **API tests:** Supertest/Jest hitting `/api/auth/login` and `/api/auth/session` with fixtures in `users` table.
- **UI tests:** Playwright — fill login form, assert redirect and `localStorage`.
- **Manual:** XSS visual, rate-limit behavior if not automated.

---

## Expected API contracts (reference)

- **200 login:** `{ success: true, token, user: { user_id, role, ... } }`
- **401:** `{ success: false, error: "..." }`
- **Session:** user-shaped JSON with `Authorization: Bearer <token>`
