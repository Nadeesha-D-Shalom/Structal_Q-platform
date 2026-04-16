# Member-1 — AI Analysis & Semi-Automatic Grading — Test Documentation

**Module scope:** FastAPI (`/evaluate`, `/compare`), Node proxy (`/api/ai-analysis/*`), persistence (`analysis_result`, `ai_question_score`, `ocr_page_result`, `diagram_check_result`), lecturer UI (`MLAnalysisPortal`, `ViewAnalysisResults`, `MLAnalysisConfig`).

**Traceability:** Aligns with SRS themes: document ingestion, semantic similarity, keywords, model answers, structure, suggested marks, risk, confidence, OCR, diagrams, pipeline routing, error handling, **no auto-publish of final marks**.

---

## 1. Document processing (TC_M1_DOC_*)

| ID | Scenario | Automation | Level |
|----|----------|------------|-------|
| TC_M1_DOC_001–008 | Text PDF, scanned OCR, mixed, DOCX, empty, corrupt, encrypted | API + Manual where noted | Integration |

**Fixture naming convention:** `*_lab_report.pdf`, `scanned_*.pdf`, `Group*_*.docx` — place under `backend/python-ml/test_files/` or project `storage/` for repeatability.

---

## 2. Semantic similarity (TC_M1_SEM_*)

| ID | Focus | Automation | Level |
|----|-------|------------|-------|
| TC_M1_SEM_001–007 | High/medium/low similarity, partial plagiarism, multi-pair, same-file guard | API (`/compare` via Node or FastAPI) | Integration |

---

## 3. Keyword coverage (TC_M1_KW_*)

| ID | Focus | Automation | Level |
|----|-------|------------|-------|
| TC_M1_KW_001–006 | Full/partial/mandatory/weighted/synonym/case | API + DB seed for `guide_question` / `question_keyword` | Integration / Unit |

---

## 4. Model answer comparison (TC_M1_MA_*)

| ID | Focus | Automation | Level |
|----|-------|------------|-------|
| TC_M1_MA_001–005 | Exact, semantic paraphrase, wrong, partial, unrelated | API | Integration |

---

## 5. Structural analysis (TC_M1_STR_*)

| ID | Focus | Automation | Level |
|----|-------|------------|-------|
| TC_M1_STR_001–005 | Order, missing, extra, wrong order, skeleton | API | Integration |

---

## 6. Suggested marks (TC_M1_SM_*)

| ID | Focus | Automation | Level |
|----|-------|------------|-------|
| TC_M1_SM_001–006 | High/medium/low/edge/consistency/cap | API | Integration |

**Assertion:** Suggested marks are **advisory**; `final_mark` publication is **lecturer-controlled** (see TC_M1_EVAL_005).

---

## 7. Risk scoring (TC_M1_RISK_*)

| ID | Focus | Automation | Level |
|----|-------|------------|-------|
| TC_M1_RISK_001–006 | Low/medium/high, similarity-driven, missing content, outlier | API | Integration |

---

## 8. Confidence score (TC_M1_CONF_*)

| ID | Focus | Automation | Level |
|----|-------|------------|-------|
| TC_M1_CONF_001–004 | High/low, OCR variance, incomplete data | API | Integration |

---

## 9. OCR (TC_M1_OCR_*)

| ID | Focus | Automation | Level |
|----|-------|------------|-------|
| TC_M1_OCR_001–005 | Clear, blurry, multi-page, failure, diagram+OCR | API | Integration |

---

## 10. Diagram validation (TC_M1_DIA_*) — **priority**

| ID | Focus | Automation | Level |
|----|-------|------------|-------|
| TC_M1_DIA_001–015 | Presence, absence, ER/UML/DFD, labels, clarity, guide mismatch, multi-diagram, DB, UI | API + DB + UI | Mixed |

**Expected JSON-style fields (when implemented):** `page_no`, `has_diagram`, `diagram_type_guess`, `clarity_score`, `detected_labels`, `issues`, `manual_review_recommended`.

---

## 11. Pipeline (TC_M1_PIPE_*)

| ID | Focus | Automation | Level |
|----|-------|------------|-------|
| TC_M1_PIPE_001–004 | Report vs code, mixed, invalid | API | Integration |

---

## 12. Errors & API (TC_M1_ERR_*, TC_M1_API_*, TC_M1_EVAL_*)

| ID | Focus | Automation | Level |
|----|-------|------------|-------|
| TC_M1_ERR_001–006 | Bad file, missing paths, ML down, timeout, DB | API / Integration | Integration |
| TC_M1_API_001–004 | analyze, results, compare, 401 | API | Integration |
| TC_M1_EVAL_001–005 | FastAPI /evaluate, batch, non-publish | API | Integration |

---

## 13. UI & non-functional (TC_M1_UI_*, TC_M1_NFR_*, TC_M1_SEC_*)

- **UI:** Lecturer flows for portal and analysis results.
- **NFR:** Performance and logging.
- **SEC:** JWT scope, path traversal.

---

## Excel import

Open **`Member_1_AI_Test_Cases.csv`** in Excel (UTF-8). If characters break, use **Data → From Text/CSV** and set UTF-8.

---

## Coverage summary (indicative)

| Category | Approx. cases in CSV |
|----------|----------------------|
| Document processing | 8 |
| Semantic similarity | 7 |
| Keywords | 6 |
| Model answer | 5 |
| Structural | 5 |
| Suggested marks | 6 |
| Risk | 6 |
| Confidence | 4 |
| OCR | 5 |
| Diagram | 15 |
| Pipeline | 4 |
| Errors | 6 |
| Node API / FastAPI / batch / security / UI / NFR | 20+ |

**Total rows:** see CSV line count (header + data rows).

---

## Automation classification legend

| Level | Meaning |
|-------|---------|
| **Unit** | Pure functions (e.g. scoring math, parsers) in isolation |
| **Integration** | FastAPI + files + DB or Node + FastAPI |
| **API** | HTTP contract (Postman, REST Assured, Supertest) |
| **UI** | Cypress / Playwright / Selenium |

| Approach | Meaning |
|----------|---------|
| **API** | Automated against REST |
| **UI** | Browser automation |
| **Manual** | Exploratory or visual (watermarks, PDF viewers) |
| **Mixed** | API setup + UI assert |
