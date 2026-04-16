# Test Suite Summary — StructaIQ (Scoped Release)

**Generated artifacts location:** `Structal_Q-platform/Test_Cases/`

| Folder | Contents | Est. test rows (CSV) |
|--------|----------|----------------------|
| `Member_1_AI/` | AI analysis, grading assist, diagrams, OCR, API | **92** (see CSV) |
| `Login/` | Authentication JWT/session | **21** |
| `Routing/` | Protected routes, lecturer direct access, roles | **18** |

---

## 1. Member-1 AI (largest suite)

**File:** `Member_1_AI/Member_1_AI_Test_Cases.csv`  
**Doc:** `Member_1_AI/Member_1_AI_Test_Cases.md`

**SRS responsibility coverage:**

| SRS theme | CSV prefix | Covered |
|-----------|------------|---------|
| Document processing | TC_M1_DOC_* | ✓ |
| Semantic similarity | TC_M1_SEM_* | ✓ |
| Keyword coverage | TC_M1_KW_* | ✓ |
| Model answer comparison | TC_M1_MA_* | ✓ |
| Structural analysis | TC_M1_STR_* | ✓ |
| Suggested marks | TC_M1_SM_* | ✓ |
| Risk scoring | TC_M1_RISK_* | ✓ |
| Confidence | TC_M1_CONF_* | ✓ |
| OCR | TC_M1_OCR_* | ✓ |
| Diagram validation | TC_M1_DIA_* | ✓ (extended) |
| Pipeline | TC_M1_PIPE_* | ✓ |
| Errors / resilience | TC_M1_ERR_* | ✓ |
| Node + FastAPI integration | TC_M1_API_*, TC_M1_EVAL_* | ✓ |
| UI | TC_M1_UI_* | ✓ |
| Non-functional | TC_M1_NFR_* | ✓ |
| Security | TC_M1_SEC_* | ✓ |
| Regression | TC_M1_REG_* | ✓ |

**Automation outlook:** Highest ROI = **API integration tests** (Postman/Newman or Jest+supertest for Node, pytest/httpx for FastAPI) using **fixed PDF/DOCX fixtures** under version control.

---

## 2. Login

**File:** `Login/Login_Test_Cases.csv`  
**Doc:** `Login/Login_Test_Cases.md`

**Focus:** Valid/invalid login, empty fields, token/session, logout, tampered/expired token, basic security.

---

## 3. Routing

**File:** `Routing/Routing_Test_Cases.csv`  
**Doc:** `Routing/Routing_Test_Cases.md`

**Focus:** `/lecturer` direct access, unauthenticated redirect, refresh, protected API, role expectations, deep links.

---

## Excel import checklist

1. Use **`*.csv`** files UTF-8.
2. In Excel: **Data → Get Data → From Text/CSV** → encoding **65001: Unicode (UTF-8)**.
3. Fill **Actual Result** and **Status** during test execution.
4. Optional: add **Sprint**, **Tester**, **Build** columns locally.

---

## Priority legend

| Priority | Meaning |
|----------|---------|
| P1 | Must pass for release / compliance |
| P2 | Should pass; acceptable with documented waiver |
| P3 | Nice-to-have / environment-dependent |

---

## Excluded (by project scope)

- Member 2–6 dedicated suites (not requested).
- Admin module tests (explicitly out of scope).
- Email delivery tests (feature disabled).
