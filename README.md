# StructaIQ Platform  
Intelligent Academic Report Evaluation & Assessment System

---

## 1. Overview

StructaIQ is a modular academic evaluation platform designed to support structured project report submission, lecturer-assisted marking, machine learning–based similarity analysis, student concern handling, and exam timetable management.

The system combines rule-based validation with ML-assisted intelligence to enhance fairness, scalability, and efficiency in academic assessment processes while ensuring that all final academic decisions remain fully under lecturer control.

The prototype implementation is validated for:
Year 2 – Semester 1 – Software Engineering  
However, the system architecture is designed to support all academic years, semesters, and subjects.

---

## 2. Core Objectives

- Digitize project report submission workflows
- Enable lecturer-defined marking guides per semester
- Detect semantic and structural similarity using ML
- Support transparent mark publishing and student concern handling
- Provide exam timetable management functionality
- Ensure scalability across multiple subjects and semesters
- Maintain modular architecture for safe parallel development

---

## 3. System Architecture

StructaIQ follows a modular monorepo architecture:

- React Web Application (Lecturer & Academic Staff)
- React Native Mobile Application (Students & Limited Lecturer Access)
- Node.js Backend API (CRUD & Business Logic)
- Python ML Service (Analysis & Similarity Detection)
- Centralized Database

High-Level Flow:

Web/Mobile → Node.js API → Python ML Service → Database

All services communicate via REST APIs.

---

## 4. Technology Stack

### Frontend
- React (Web Application)
- React Native (Mobile Application)

### Backend
- Node.js (Express-based API)
- Python (ML service)

### Database
- Relational database (MySQL / PostgreSQL / MSSQL)

### ML
- Text embeddings
- Semantic similarity computation
- Structural pattern comparison
- Outlier detection

---

## 5. Project Structure

```
structaiq-platform/
│
├── backend/
│   ├── node-api/
│   └── python-ml/
│
├── frontend/
│   ├── web-app-new/   # React web app
│   └── mobile-app/
│
├── database/
│
├── docs/
│
├── README.md
└── CONTRIBUTING.md
```

Each backend module is isolated under:

```
backend/node-api/src/modules/
```

Each member works only within their assigned module directory to prevent merge conflicts.

---

## 6. Functional Modules

### Member 1 – ML Analysis & Intelligence Core
- Semantic similarity detection
- Structural similarity detection
- Outlier identification
- Risk scoring
- Analysis reports

Entity: analysis_result  
Full CRUD supported

Important:
- ML does not assign marks
- ML does not retrain during semester
- Model is trained offline

---

### Member 2 – Student Submission Management
- Project report upload (PDF/DOCX)
- Resubmission version tracking
- Deadline management
- Submission reports

Entity: submission  
Full CRUD supported

---

### Member 3 – Academic Configuration & Marking Guides
- Subject creation per semester
- Dynamic marking guide creation
- Section rule configuration
- Diagram requirements
- Rule versioning

Entities:
- subject
- marking_guide  
Full CRUD supported

---

### Member 4 – Marks Publishing & Concern Management
- Mark publishing control
- Student concern submission
- Concern review workflow
- Mark revision tracking

Entity: mark_concern  
Full CRUD supported

---

### Member 5 – Lecturer Review & Mark Entry
- Manual mark entry
- Risk-based prioritization
- Review finalization
- Review reports

Entity: review  
Full CRUD supported

---

### Member 6 – Exam Timetable Management
- Create semester exam timetable
- Conflict validation
- Venue/time overlap detection
- Timetable publishing
- Timetable reports

Entity: exam_timetable  
Full CRUD supported

---

## 7. Machine Learning Scope

The ML component performs:

- Semantic similarity detection
- Structural similarity detection
- Cohort comparison
- Risk scoring

ML Data Sources:
- Extracted report text
- Section structure
- Comparison against cohort
- Rule validation outcomes

ML Limitations:
- Does not assign grades
- Does not replace lecturer
- Does not retrain during live semester operations

---

## 8. Scalability & Concurrency

- Supports 100+ concurrent academic users
- Uses asynchronous processing
- Background job queue for ML tasks
- Non-blocking UI for lecturers

---

## 9. Deployment Strategy

- Backend deployed on cloud server or institutional infrastructure
- ML service deployed separately
- Web app hosted on web server
- Mobile app deployable to Google Play Store

---

## 10. Security & Access Control

- Role-based authentication
  - Student
  - Lecturer
- Token-based API access
- Controlled mark publishing
- Concern submission time windows

---

## 11. Development Guidelines

- Each member works in a dedicated module directory
- Feature branches required for development
- Pull requests must target dev branch
- No direct pushes to main
- Follow consistent naming conventions

---

## 12. Future Enhancements

- Cross-subject ML generalization
- Integration with university ERP systems
- Advanced analytics dashboards
- Multi-language report analysis

---

## 13. Summary

StructaIQ is a modular, scalable, and intelligent academic evaluation platform that enhances transparency, efficiency, and integrity in project-based assessment while preserving full lecturer authority over final decisions.

---

Project Repository: structaiq-platform  
Version: 1.0  
Status: Academic Prototype
