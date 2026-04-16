# Automation & Test Level Matrix (Project-Wide)

This document explains how **Automation Approach** and **Test Level** columns are used in all `*_Test_Cases.csv` files.

---

## Column: Automation Approach

| Value | When to use | Tooling examples |
|-------|-------------|------------------|
| **API** | Contract testing without browser | Postman, Newman, Jest + supertest, pytest + httpx |
| **UI** | React routing, forms, visibility | Cypress, Playwright, Selenium |
| **Manual** | Visual PDF, watermark, ad-hoc ML tuning | Test charter, screenshots |
| **Mixed** | API seed + UI assert | Playwright + API fixture |
| **API + Integration** | Multi-hop: Node → FastAPI → file | Supertest + live ML_URL |
| **Integration** | DB + service (no UI) | Testcontainers MSSQL, pytest |

---

## Column: Test Level

| Value | Scope | Typical target |
|-------|-------|----------------|
| **Unit** | Single function, no I/O | `scoring_rules`, pure parsers |
| **Integration** | Services + DB or ML + disk | End-to-end pipeline in test env |
| **API** | HTTP contract only | `/api/ai-analysis/analyze` |
| **UI** | Browser E2E | Login → lecturer page |

---

## Recommended automation order (ROI)

1. **Login** — `POST /api/auth/login` + session (fast, stable).
2. **Routing** — API 401 without token; optional Playwright for protected routes.
3. **Member-1** — `/api/ai-analysis/compare` + `/analyze` with **pinned** PDF fixtures; diagram cases last (flakier).

---

## Traceability

Each CSV row is self-contained; **Test Case ID** is stable for import into Jira / Azure DevOps / TestRail.
