# StructaIQ / Structal Q Platform — Test Case Repository

This folder contains **industry-style test suites** for selected scope only:

| Folder | Scope |
|--------|--------|
| `Member_1_AI/` | AI Analysis & Semi-Automatic Grading (FastAPI + Node integration) |
| `Login/` | Authentication (JWT / session) |
| `Routing/` | Protected routes & lecturer direct access |

## Folder layout

```
Test_Cases/
├── README.md
├── SUMMARY.md
├── Automation_Matrix.md
├── Member_1_AI/
│   ├── Member_1_AI_Test_Cases.csv
│   └── Member_1_AI_Test_Cases.md
├── Login/
│   ├── Login_Test_Cases.csv
│   └── Login_Test_Cases.md
└── Routing/
    ├── Routing_Test_Cases.csv
    └── Routing_Test_Cases.md
```

## Files per module

| File | Purpose |
|------|---------|
| `*_Test_Cases.csv` | **Excel-ready** — open in Excel or import to Google Sheets (UTF-8). |
| `*_Test_Cases.md` | Human-readable tables + automation notes + traceability. |
| `Automation_Matrix.md` | Summary of automation classification (where present). |

## Column reference (CSV)

1. Test Case ID  
2. Module  
3. Test Scenario  
4. Test Description  
5. Preconditions  
6. Test Steps  
7. Test Data  
8. Expected Result  
9. Actual Result *(execute & fill)*  
10. Status *(Pass/Fail/Blocked — execute & fill)*  
11. Priority *(P1–P3)*  
12. Remarks  
13. Automation Approach *(API / UI / Manual / Mixed)*  
14. Test Level *(Unit / Integration / API / UI)*  

## Traceability

Member-1 cases map to **SRS-style responsibilities**: document ingestion, similarity, keywords, model answers, structure, suggested marks, risk, confidence, OCR, diagrams, pipeline routing, errors.

---

*Generated for university / QA use. Execute tests against your deployed environment; `Actual Result` and `Status` are intentionally left blank until execution.*
