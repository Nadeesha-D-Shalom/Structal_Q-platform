# Routing & Protected Access — Test Documentation

**Scope:** React `ProtectedRoute` in `App.js`, direct navigation to `/lecturer`, `/student`, deep links, Express `verifyToken` on `/api/*` (via `routes/index.js`).

**Focus areas (per request):**

- Direct URL access to `/lecturer`
- Unauthorized access handling
- Refresh behavior
- Protected routes
- Role-based access (lecturer vs student)

---

## Test case file

| File | Description |
|------|-------------|
| `Routing_Test_Cases.csv` | Excel-ready |

---

## Coverage map

| Area | TC IDs |
|------|--------|
| Lecturer / student direct URLs | TC_RT_001–004, 011–013 |
| Unauthenticated access | TC_RT_002, 004 |
| Session + refresh | TC_RT_005–008 |
| Role separation | TC_RT_009–010 |
| Backend 401 without JWT | TC_RT_015 |
| Backend 200 with JWT | TC_RT_016 |
| Edge: 404 route, back button, multi-tab | TC_RT_014, 017–018 |

---

## Automation suggestions

- **UI (E2E):** Playwright — `storageState` with/without token; navigate to URLs; assert redirect or content.
- **API:** curl/axios — call protected endpoint without/with `Authorization`.
- **Manual:** Browser back after logout, multi-tab logout sync.

---

## Implementation notes (code alignment)

- Frontend: `ProtectedRoute` fetches `/api/auth/session` with Bearer token.
- Backend: `router.use('/subjects', verifyToken, ...)` pattern in `routes/index.js`.
