/* 
StructaIQ (SRS v3.0) - FULL SQL Server DDL (Corrected)
Fixes:
- boolean -> bit
- json -> nvarchar(max)  (optionally add ISJSON checks later)
- text -> nvarchar(max)
- Adds safe drop section (optional) to rerun cleanly
- Uses schema dbo and table name users
*/

SET NOCOUNT ON;
GO

/* =========================
   OPTION A: CLEAN RE-RUN
   Uncomment this block ONLY if you want to DROP existing tables first.
   (Drops in dependency order)
========================= */
/*
IF OBJECT_ID('dbo.exam_notification_log','U') IS NOT NULL DROP TABLE dbo.exam_notification_log;
IF OBJECT_ID('dbo.exam_conflict_log','U') IS NOT NULL DROP TABLE dbo.exam_conflict_log;
IF OBJECT_ID('dbo.exam_capacity_tracking','U') IS NOT NULL DROP TABLE dbo.exam_capacity_tracking;
IF OBJECT_ID('dbo.exam_session','U') IS NOT NULL DROP TABLE dbo.exam_session;
IF OBJECT_ID('dbo.exam_timetable','U') IS NOT NULL DROP TABLE dbo.exam_timetable;
IF OBJECT_ID('dbo.exam_room','U') IS NOT NULL DROP TABLE dbo.exam_room;

IF OBJECT_ID('dbo.evaluation_conflict_log','U') IS NOT NULL DROP TABLE dbo.evaluation_conflict_log;
IF OBJECT_ID('dbo.evaluation_email_log','U') IS NOT NULL DROP TABLE dbo.evaluation_email_log;
IF OBJECT_ID('dbo.evaluation_group_assignment','U') IS NOT NULL DROP TABLE dbo.evaluation_group_assignment;
IF OBJECT_ID('dbo.evaluation_slot','U') IS NOT NULL DROP TABLE dbo.evaluation_slot;
IF OBJECT_ID('dbo.evaluation_schedule','U') IS NOT NULL DROP TABLE dbo.evaluation_schedule;
IF OBJECT_ID('dbo.evaluation_location','U') IS NOT NULL DROP TABLE dbo.evaluation_location;

IF OBJECT_ID('dbo.audit_log','U') IS NOT NULL DROP TABLE dbo.audit_log;
IF OBJECT_ID('dbo.mark_revision_log','U') IS NOT NULL DROP TABLE dbo.mark_revision_log;
IF OBJECT_ID('dbo.concern_window','U') IS NOT NULL DROP TABLE dbo.concern_window;
IF OBJECT_ID('dbo.mark_concern','U') IS NOT NULL DROP TABLE dbo.mark_concern;
IF OBJECT_ID('dbo.mark_alert','U') IS NOT NULL DROP TABLE dbo.mark_alert;
IF OBJECT_ID('dbo.final_question_mark','U') IS NOT NULL DROP TABLE dbo.final_question_mark;
IF OBJECT_ID('dbo.final_mark','U') IS NOT NULL DROP TABLE dbo.final_mark;

IF OBJECT_ID('dbo.diagram_check_result','U') IS NOT NULL DROP TABLE dbo.diagram_check_result;
IF OBJECT_ID('dbo.ocr_page_result','U') IS NOT NULL DROP TABLE dbo.ocr_page_result;
IF OBJECT_ID('dbo.ai_rubric_score','U') IS NOT NULL DROP TABLE dbo.ai_rubric_score;
IF OBJECT_ID('dbo.ai_question_score','U') IS NOT NULL DROP TABLE dbo.ai_question_score;
IF OBJECT_ID('dbo.analysis_similarity_detail','U') IS NOT NULL DROP TABLE dbo.analysis_similarity_detail;
IF OBJECT_ID('dbo.analysis_result','U') IS NOT NULL DROP TABLE dbo.analysis_result;

IF OBJECT_ID('dbo.submission','U') IS NOT NULL DROP TABLE dbo.submission;
IF OBJECT_ID('dbo.file_storage','U') IS NOT NULL DROP TABLE dbo.file_storage;

IF OBJECT_ID('dbo.question_keyword','U') IS NOT NULL DROP TABLE dbo.question_keyword;
IF OBJECT_ID('dbo.guide_question','U') IS NOT NULL DROP TABLE dbo.guide_question;
IF OBJECT_ID('dbo.guide_section_rule','U') IS NOT NULL DROP TABLE dbo.guide_section_rule;
IF OBJECT_ID('dbo.guide_rubric_item','U') IS NOT NULL DROP TABLE dbo.guide_rubric_item;
IF OBJECT_ID('dbo.marking_guide','U') IS NOT NULL DROP TABLE dbo.marking_guide;

IF OBJECT_ID('dbo.assessment','U') IS NOT NULL DROP TABLE dbo.assessment;
IF OBJECT_ID('dbo.subject_offering','U') IS NOT NULL DROP TABLE dbo.subject_offering;
IF OBJECT_ID('dbo.subject','U') IS NOT NULL DROP TABLE dbo.subject;

IF OBJECT_ID('dbo.users','U') IS NOT NULL DROP TABLE dbo.users;
GO
*/

BEGIN TRY
  BEGIN TRAN;

  /* =========================
     1) CORE TABLES
  ========================= */

  IF OBJECT_ID('dbo.users','U') IS NULL
  CREATE TABLE dbo.users (
    user_id bigint IDENTITY(1,1) PRIMARY KEY,
    first_name nvarchar(255) NULL,
    last_name nvarchar(255) NULL,
    email nvarchar(255) NOT NULL UNIQUE,
    password_hash nvarchar(255) NULL,
    role nvarchar(50) NOT NULL, -- ADMIN / LECTURER / STUDENT
    registration_no nvarchar(255) NULL,
    program_id bigint NULL,
    status nvarchar(50) NULL, -- ACTIVE / INACTIVE / SUSPENDED
    created_at datetime NULL,
    updated_at datetime NULL,
    last_login_at datetime NULL
  );

  IF OBJECT_ID('dbo.subject','U') IS NULL
  CREATE TABLE dbo.subject (
    subject_id bigint IDENTITY(1,1) PRIMARY KEY,
    subject_code nvarchar(255) NULL,
    subject_name nvarchar(255) NULL,
    credit_value int NULL,
    department nvarchar(255) NULL,
    status nvarchar(50) NULL,
    created_at datetime NULL,
    updated_at datetime NULL
  );

  IF OBJECT_ID('dbo.subject_offering','U') IS NULL
  CREATE TABLE dbo.subject_offering (
    offering_id bigint IDENTITY(1,1) PRIMARY KEY,
    subject_id bigint NOT NULL,
    academic_year nvarchar(255) NULL,
    semester nvarchar(255) NULL,
    intake_name nvarchar(255) NULL,
    is_active bit NULL,
    created_at datetime NULL,
    updated_at datetime NULL
  );

  IF OBJECT_ID('dbo.assessment','U') IS NULL
  CREATE TABLE dbo.assessment (
    assessment_id bigint IDENTITY(1,1) PRIMARY KEY,
    offering_id bigint NOT NULL,
    assessment_title nvarchar(255) NULL,
    assessment_type nvarchar(50) NULL, -- EXAM / LAB / REPORT / ASSIGNMENT
    total_marks decimal(10,2) NULL,
    start_date datetime NULL,
    due_date datetime NULL,
    allow_resubmission bit NULL,
    max_resubmissions int NULL,
    late_policy_enabled bit NULL,
    grace_minutes int NULL,
    requires_ai_analysis bit NULL,
    created_by bigint NOT NULL,
    created_at datetime NULL,
    updated_at datetime NULL,
    status nvarchar(50) NULL
  );

  /* =========================
     2) MARKING GUIDE STRUCTURE
  ========================= */

  IF OBJECT_ID('dbo.marking_guide','U') IS NULL
  CREATE TABLE dbo.marking_guide (
    marking_guide_id bigint IDENTITY(1,1) PRIMARY KEY,
    assessment_id bigint NOT NULL,
    version_no int NULL,
    title nvarchar(255) NULL,
    description nvarchar(max) NULL,
    order_sensitive bit NULL,
    requires_diagram_check bit NULL,
    diagram_types_expected nvarchar(max) NULL, -- JSON stored as text
    created_by bigint NOT NULL,
    created_at datetime NULL,
    updated_at datetime NULL,
    status nvarchar(50) NULL
  );

  IF OBJECT_ID('dbo.guide_section_rule','U') IS NULL
  CREATE TABLE dbo.guide_section_rule (
    section_rule_id bigint IDENTITY(1,1) PRIMARY KEY,
    marking_guide_id bigint NOT NULL,
    section_name nvarchar(255) NULL,
    is_mandatory bit NULL,
    expected_order int NULL,
    min_words int NULL,
    max_words int NULL,
    created_at datetime NULL
  );

  IF OBJECT_ID('dbo.guide_question','U') IS NULL
  CREATE TABLE dbo.guide_question (
    question_id bigint IDENTITY(1,1) PRIMARY KEY,
    marking_guide_id bigint NOT NULL,
    question_no int NULL,
    question_text nvarchar(max) NULL,
    max_marks decimal(10,2) NULL,
    model_answer_text nvarchar(max) NULL,
    keyword_weight decimal(10,4) NULL,
    semantic_weight decimal(10,4) NULL,
    created_at datetime NULL,
    updated_at datetime NULL
  );

  IF OBJECT_ID('dbo.question_keyword','U') IS NULL
  CREATE TABLE dbo.question_keyword (
    keyword_id bigint IDENTITY(1,1) PRIMARY KEY,
    question_id bigint NOT NULL,
    keyword_text nvarchar(255) NULL,
    marks_weight decimal(10,4) NULL,
    is_mandatory bit NULL,
    match_type nvarchar(50) NULL, -- EXACT / STEM / SEMANTIC
    created_at datetime NULL
  );

  IF OBJECT_ID('dbo.guide_rubric_item','U') IS NULL
  CREATE TABLE dbo.guide_rubric_item (
    rubric_item_id bigint IDENTITY(1,1) PRIMARY KEY,
    marking_guide_id bigint NOT NULL,
    criterion_name nvarchar(255) NULL,
    description nvarchar(max) NULL,
    max_marks decimal(10,2) NULL,
    weight decimal(10,4) NULL,
    created_at datetime NULL,
    updated_at datetime NULL
  );

  /* =========================
     3) SUBMISSIONS
  ========================= */

  IF OBJECT_ID('dbo.file_storage','U') IS NULL
  CREATE TABLE dbo.file_storage (
    file_id bigint IDENTITY(1,1) PRIMARY KEY,
    original_file_name nvarchar(255) NULL,
    stored_file_name nvarchar(255) NULL,
    storage_category nvarchar(50) NULL, -- EXAM / LAB / REPORT
    storage_path nvarchar(512) NULL,
    mime_type nvarchar(255) NULL,
    file_size_bytes bigint NULL,
    sha256_hash nvarchar(255) NULL,
    upload_user_id bigint NOT NULL,
    uploaded_at datetime NULL,
    is_deleted bit NULL
  );

  IF OBJECT_ID('dbo.submission','U') IS NULL
  CREATE TABLE dbo.submission (
    submission_id bigint IDENTITY(1,1) PRIMARY KEY,
    assessment_id bigint NOT NULL,
    student_id bigint NOT NULL,
    attempt_no int NULL,
    submitted_at datetime NULL,
    is_late bit NULL,
    late_minutes int NULL,
    file_id bigint NOT NULL,
    integrity_hash nvarchar(255) NULL,
    submission_status nvarchar(50) NULL, -- SUBMITTED / RESUBMITTED / LOCKED
    created_at datetime NULL,
    updated_at datetime NULL
  );

  /* =========================
     4) AI ANALYSIS
  ========================= */

  IF OBJECT_ID('dbo.analysis_result','U') IS NULL
  CREATE TABLE dbo.analysis_result (
    analysis_result_id bigint IDENTITY(1,1) PRIMARY KEY,
    submission_id bigint NOT NULL,
    marking_guide_id bigint NOT NULL,
    analysis_type nvarchar(255) NULL,
    similarity_max decimal(10,4) NULL,
    similarity_avg decimal(10,4) NULL,
    structural_similarity_avg decimal(10,4) NULL,
    missing_sections nvarchar(max) NULL, -- JSON stored as text
    risk_score decimal(10,4) NULL,
    risk_level nvarchar(50) NULL, -- LOW / MEDIUM / HIGH
    ocr_used bit NULL,
    cv_used bit NULL,
    started_at datetime NULL,
    completed_at datetime NULL,
    status nvarchar(50) NULL
  );

  IF OBJECT_ID('dbo.analysis_similarity_detail','U') IS NULL
  CREATE TABLE dbo.analysis_similarity_detail (
    similarity_detail_id bigint IDENTITY(1,1) PRIMARY KEY,
    analysis_result_id bigint NOT NULL,
    compared_submission_id bigint NOT NULL,
    semantic_similarity decimal(10,4) NULL,
    structural_similarity decimal(10,4) NULL,
    cluster_id bigint NULL,
    created_at datetime NULL
  );

  IF OBJECT_ID('dbo.ai_question_score','U') IS NULL
  CREATE TABLE dbo.ai_question_score (
    ai_q_score_id bigint IDENTITY(1,1) PRIMARY KEY,
    analysis_result_id bigint NOT NULL,
    question_id bigint NOT NULL,
    keyword_matches nvarchar(max) NULL, -- JSON stored as text
    keyword_score decimal(10,4) NULL,
    semantic_score decimal(10,4) NULL,
    suggested_marks decimal(10,2) NULL,
    confidence decimal(10,4) NULL,
    missing_keywords nvarchar(max) NULL, -- JSON stored as text
    created_at datetime NULL
  );

  IF OBJECT_ID('dbo.ai_rubric_score','U') IS NULL
  CREATE TABLE dbo.ai_rubric_score (
    ai_rubric_score_id bigint IDENTITY(1,1) PRIMARY KEY,
    analysis_result_id bigint NOT NULL,
    rubric_item_id bigint NOT NULL,
    suggested_marks decimal(10,2) NULL,
    confidence decimal(10,4) NULL,
    evidence_excerpt nvarchar(max) NULL,
    created_at datetime NULL
  );

  IF OBJECT_ID('dbo.ocr_page_result','U') IS NULL
  CREATE TABLE dbo.ocr_page_result (
    ocr_id bigint IDENTITY(1,1) PRIMARY KEY,
    analysis_result_id bigint NOT NULL,
    page_no int NULL,
    ocr_text nvarchar(max) NULL,
    ocr_confidence decimal(10,4) NULL,
    has_diagram bit NULL,
    created_at datetime NULL
  );

  IF OBJECT_ID('dbo.diagram_check_result','U') IS NULL
  CREATE TABLE dbo.diagram_check_result (
    diagram_check_id bigint IDENTITY(1,1) PRIMARY KEY,
    analysis_result_id bigint NOT NULL,
    diagram_type nvarchar(50) NULL, -- ER / UML / DFD
    page_no int NULL,
    detected_labels nvarchar(max) NULL, -- JSON stored as text
    expected_labels nvarchar(max) NULL, -- JSON stored as text
    match_score decimal(10,4) NULL,
    issues nvarchar(max) NULL, -- JSON stored as text
    created_at datetime NULL
  );

  /* =========================
     5) FINAL MARKING & CONCERNS
  ========================= */

  IF OBJECT_ID('dbo.final_mark','U') IS NOT NULL DROP TABLE dbo.final_mark;
  CREATE TABLE dbo.final_mark (
    id INT IDENTITY(1,1) PRIMARY KEY,
    final_mark_id VARCHAR(50) UNIQUE,
    
    -- Foreign Keys
    submission_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,

    ai_marks DECIMAL(5,2) DEFAULT 0.00,
    diagram_marks DECIMAL(5,2) DEFAULT 0.00,
    total_marks_awarded DECIMAL(5,2) DEFAULT 0.00,
    
    marking_status VARCHAR(20) DEFAULT 'DRAFT' 
        CHECK (marking_status IN ('DRAFT', 'VALIDATED', 'PUBLISHED')),
    
    -- Audit Timestamps
    published_at DATETIME DEFAULT GETDATE(),
    published_by VARCHAR(255) NOT NULL,
    updated_at DATETIME DEFAULT GETDATE(),
    updated_by VARCHAR(255) NULL,
    concern_window_open BIT NOT NULL DEFAULT 1
  );

  --New Table
  IF OBJECT_ID('dbo.evaluated_results', 'U') IS NULL
  CREATE TABLE dbo.evaluated_results (
    evaluation_id bigint IDENTITY(1,1) PRIMARY KEY,
    submission_id bigint NOT NULL,
    ai_marks decimal(10,2) NULL DEFAULT 0.00,
    diagram_marks decimal(10,2) NULL DEFAULT 0.00,
    final_mark decimal(10,2) NULL DEFAULT 0.00,
    created_at datetime NULL
  );
  
  --New Table
  IF OBJECT_ID('dbo.student_notifications', 'U') IS NULL
  CREATE TABLE student_notifications (
    notification_id    BIGINT IDENTITY(1,1)  PRIMARY KEY,
    student_id         BIGINT                NOT NULL,
    notification_type  VARCHAR(50)           NOT NULL, 
    title              NVARCHAR(255)         NOT NULL,
    message            NVARCHAR(1000)        NOT NULL,  
    is_read            BIT                   NOT NULL DEFAULT 0,
    read_at            DATETIMEOFFSET        NULL,
    created_at         DATETIMEOFFSET        NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  )

  
  IF OBJECT_ID('dbo.mark_concern','U') IS NOT NULL DROP TABLE dbo.mark_concern;
  CREATE TABLE dbo.mark_concern (
    id INT IDENTITY(1,1) PRIMARY KEY,
    concern_id VARCHAR(20) UNIQUE,
    
    student_id BIGINT NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    academic_year VARCHAR(100) NOT NULL,
    submission_id BIGINT NOT NULL,
    concern_message NVARCHAR(MAX) NOT NULL,
  
    priority_level VARCHAR(10) DEFAULT 'Low'
        CHECK (priority_level IN ('Low', 'Medium', 'High')),
        
    concern_status VARCHAR(20) DEFAULT 'Pending'
        CHECK (concern_status IN ('Pending', 'Accepted', 'Rejected', 'Revised')),
    
    created_at DATETIME DEFAULT GETDATE(),
    last_modified DATETIME DEFAULT GETDATE(),
    
    revised_by VARCHAR(255) NULL,
    revised_on DATETIME NULL,
    lecturer_comment NVARCHAR(MAX) NULL
  );


IF OBJECT_ID('dbo.mark_revision_log','U') IS NOT NULL DROP TABLE dbo.mark_revision_log;
CREATE TABLE dbo.mark_revision_log (
    revision_id bigint IDENTITY(1,1) PRIMARY KEY,
    submission_id bigint NOT NULL,
    lecturer_name VARCHAR(255) NOT NULL,
    old_mark decimal(10,2) NULL,
    new_mark decimal(10,2) NULL,
    revision_reason nvarchar(max) NULL,
    revised_at datetime NULL DEFAULT GETDATE()
);

  IF OBJECT_ID('dbo.audit_log','U') IS NULL
  CREATE TABLE dbo.audit_log (
    audit_id bigint IDENTITY(1,1) PRIMARY KEY,
    actor_user_id bigint NOT NULL,
    action_type nvarchar(255) NULL,
    entity_name nvarchar(255) NULL,
    entity_id nvarchar(255) NULL,
    old_value_json nvarchar(max) NULL, -- JSON stored as text
    new_value_json nvarchar(max) NULL, -- JSON stored as text
    ip_address nvarchar(255) NULL,
    created_at datetime NULL
  );

  /* =========================
     6) EVALUATION SCHEDULING
  ========================= */

  IF OBJECT_ID('dbo.evaluation_location','U') IS NULL
  CREATE TABLE dbo.evaluation_location (
    location_id bigint IDENTITY(1,1) PRIMARY KEY,
    location_name nvarchar(255) NULL,
    building_name nvarchar(255) NULL,
    room_number nvarchar(255) NULL,
    capacity int NULL,
    available_from time NULL,
    available_to time NULL,
    status nvarchar(50) NULL,
    created_at datetime NULL
  );

  IF OBJECT_ID('dbo.evaluation_schedule','U') IS NULL
  CREATE TABLE dbo.evaluation_schedule (
    evaluation_schedule_id bigint IDENTITY(1,1) PRIMARY KEY,
    assessment_id bigint NOT NULL,
    location_id bigint NOT NULL,
    schedule_title nvarchar(255) NULL,
    [date] date NULL,
    start_time time NULL,
    end_time time NULL,
    duration_per_group_minutes int NULL,
    buffer_minutes int NULL,
    total_groups int NULL,
    is_published bit NULL,
    published_at datetime NULL,
    published_by bigint NULL,
    draft_version_no int NULL,
    created_by bigint NOT NULL,
    created_at datetime NULL,
    updated_at datetime NULL,
    status nvarchar(50) NULL
  );

  IF OBJECT_ID('dbo.evaluation_slot','U') IS NULL
  CREATE TABLE dbo.evaluation_slot (
    evaluation_slot_id bigint IDENTITY(1,1) PRIMARY KEY,
    evaluation_schedule_id bigint NOT NULL,
    slot_sequence_no int NULL,
    slot_start_time time NULL,
    slot_end_time time NULL,
    buffer_applied bit NULL,
    slot_status nvarchar(50) NULL,
    created_at datetime NULL
  );

  IF OBJECT_ID('dbo.evaluation_group_assignment','U') IS NULL
  CREATE TABLE dbo.evaluation_group_assignment (
    assignment_id bigint IDENTITY(1,1) PRIMARY KEY,
    evaluation_slot_id bigint NOT NULL,
    group_id nvarchar(255) NULL,
    assigned_by bigint NOT NULL,
    assigned_at datetime NULL,
    attendance_status nvarchar(50) NULL,
    evaluation_completed bit NULL,
    remarks nvarchar(max) NULL
  );

  IF OBJECT_ID('dbo.evaluation_email_log','U') IS NULL
  CREATE TABLE dbo.evaluation_email_log (
    email_log_id bigint IDENTITY(1,1) PRIMARY KEY,
    evaluation_schedule_id bigint NOT NULL,
    recipient_user_id bigint NOT NULL,
    email_type nvarchar(255) NULL,
    sent_at datetime NULL,
    delivery_status nvarchar(50) NULL,
    retry_count int NULL
  );

  IF OBJECT_ID('dbo.evaluation_conflict_log','U') IS NULL
  CREATE TABLE dbo.evaluation_conflict_log (
    conflict_id bigint IDENTITY(1,1) PRIMARY KEY,
    evaluation_schedule_id bigint NOT NULL,
    conflict_type nvarchar(255) NULL,
    conflict_description nvarchar(max) NULL,
    detected_at datetime NULL,
    resolved bit NULL,
    resolved_by bigint NULL,
    resolved_at datetime NULL
  );

  /* =========================
     7) EXAM TIMETABLE
  ========================= */

  IF OBJECT_ID('dbo.exam_room','U') IS NULL
  CREATE TABLE dbo.exam_room (
    room_id bigint IDENTITY(1,1) PRIMARY KEY,
    room_name nvarchar(255) NULL,
    building nvarchar(255) NULL,
    floor nvarchar(255) NULL,
    capacity int NULL,
    has_projector bit NULL,
    has_ac bit NULL,
    is_available bit NULL,
    created_at datetime NULL
  );

  IF OBJECT_ID('dbo.exam_timetable','U') IS NULL
  CREATE TABLE dbo.exam_timetable (
    exam_timetable_id bigint IDENTITY(1,1) PRIMARY KEY,
    academic_year nvarchar(255) NULL,
    semester nvarchar(255) NULL,
    title nvarchar(255) NULL,
    draft_version_no int NULL,
    is_published bit NULL,
    published_at datetime NULL,
    published_by bigint NULL,
    created_by bigint NOT NULL,
    created_at datetime NULL,
    updated_at datetime NULL,
    status nvarchar(50) NULL
  );

  IF OBJECT_ID('dbo.exam_session','U') IS NULL
  CREATE TABLE dbo.exam_session (
    exam_session_id bigint IDENTITY(1,1) PRIMARY KEY,
    exam_timetable_id bigint NOT NULL,
    subject_id bigint NOT NULL,
    room_id bigint NOT NULL,
    exam_type nvarchar(50) NULL, -- THEORY / PRACTICAL
    exam_date date NULL,
    start_time time NULL,
    end_time time NULL,
    duration_minutes int NULL,
    buffer_minutes int NULL,
    expected_students_count int NULL,
    session_status nvarchar(50) NULL,
    created_at datetime NULL,
    updated_at datetime NULL
  );

  IF OBJECT_ID('dbo.exam_capacity_tracking','U') IS NULL
  CREATE TABLE dbo.exam_capacity_tracking (
    capacity_id bigint IDENTITY(1,1) PRIMARY KEY,
    exam_session_id bigint NOT NULL,
    room_id bigint NOT NULL,
    allocated_students int NULL,
    remaining_capacity int NULL,
    capacity_validated bit NULL,
    validated_at datetime NULL
  );

  IF OBJECT_ID('dbo.exam_conflict_log','U') IS NULL
  CREATE TABLE dbo.exam_conflict_log (
    conflict_id bigint IDENTITY(1,1) PRIMARY KEY,
    exam_session_id bigint NOT NULL,
    conflict_type nvarchar(255) NULL,
    conflict_description nvarchar(max) NULL,
    detected_at datetime NULL,
    resolved bit NULL,
    resolved_by bigint NULL,
    resolved_at datetime NULL
  );

  IF OBJECT_ID('dbo.exam_notification_log','U') IS NULL
  CREATE TABLE dbo.exam_notification_log (
    notification_id bigint IDENTITY(1,1) PRIMARY KEY,
    exam_session_id bigint NOT NULL,
    user_id bigint NOT NULL,
    notification_type nvarchar(255) NULL,
    sent_at datetime NULL,
    delivery_status nvarchar(50) NULL
  );

  /* =========================
     8) FOREIGN KEYS (only add if not already present)
  ========================= */

  -- subject_offering -> subject
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_subject_offering_subject')
    ALTER TABLE dbo.subject_offering
    ADD CONSTRAINT FK_subject_offering_subject
    FOREIGN KEY (subject_id) REFERENCES dbo.subject(subject_id);

  -- assessment -> subject_offering, user
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_assessment_offering')
    ALTER TABLE dbo.assessment
    ADD CONSTRAINT FK_assessment_offering
    FOREIGN KEY (offering_id) REFERENCES dbo.subject_offering(offering_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_assessment_created_by')
    ALTER TABLE dbo.assessment
    ADD CONSTRAINT FK_assessment_created_by
    FOREIGN KEY (created_by) REFERENCES dbo.users(user_id);

  -- marking_guide -> assessment, user
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_marking_guide_assessment')
    ALTER TABLE dbo.marking_guide
    ADD CONSTRAINT FK_marking_guide_assessment
    FOREIGN KEY (assessment_id) REFERENCES dbo.assessment(assessment_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_marking_guide_created_by')
    ALTER TABLE dbo.marking_guide
    ADD CONSTRAINT FK_marking_guide_created_by
    FOREIGN KEY (created_by) REFERENCES dbo.users(user_id);

  -- guide_* -> marking_guide / guide_question
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_guide_section_rule_marking_guide')
    ALTER TABLE dbo.guide_section_rule
    ADD CONSTRAINT FK_guide_section_rule_marking_guide
    FOREIGN KEY (marking_guide_id) REFERENCES dbo.marking_guide(marking_guide_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_guide_question_marking_guide')
    ALTER TABLE dbo.guide_question
    ADD CONSTRAINT FK_guide_question_marking_guide
    FOREIGN KEY (marking_guide_id) REFERENCES dbo.marking_guide(marking_guide_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_question_keyword_question')
    ALTER TABLE dbo.question_keyword
    ADD CONSTRAINT FK_question_keyword_question
    FOREIGN KEY (question_id) REFERENCES dbo.guide_question(question_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_guide_rubric_item_marking_guide')
    ALTER TABLE dbo.guide_rubric_item
    ADD CONSTRAINT FK_guide_rubric_item_marking_guide
    FOREIGN KEY (marking_guide_id) REFERENCES dbo.marking_guide(marking_guide_id);

  -- file_storage -> user
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_file_storage_upload_user')
    ALTER TABLE dbo.file_storage
    ADD CONSTRAINT FK_file_storage_upload_user
    FOREIGN KEY (upload_user_id) REFERENCES dbo.users(user_id);

  -- submission -> assessment, user, file_storage
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_submission_assessment')
    ALTER TABLE dbo.submission
    ADD CONSTRAINT FK_submission_assessment
    FOREIGN KEY (assessment_id) REFERENCES dbo.assessment(assessment_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_submission_student')
    ALTER TABLE dbo.submission
    ADD CONSTRAINT FK_submission_student
    FOREIGN KEY (student_id) REFERENCES dbo.users(user_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_submission_file')
    ALTER TABLE dbo.submission
    ADD CONSTRAINT FK_submission_file
    FOREIGN KEY (file_id) REFERENCES dbo.file_storage(file_id);

  -- analysis_result -> submission, marking_guide
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_analysis_result_submission')
    ALTER TABLE dbo.analysis_result
    ADD CONSTRAINT FK_analysis_result_submission
    FOREIGN KEY (submission_id) REFERENCES dbo.submission(submission_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_analysis_result_marking_guide')
    ALTER TABLE dbo.analysis_result
    ADD CONSTRAINT FK_analysis_result_marking_guide
    FOREIGN KEY (marking_guide_id) REFERENCES dbo.marking_guide(marking_guide_id);

  -- analysis_similarity_detail -> analysis_result, submission
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_similarity_detail_analysis_result')
    ALTER TABLE dbo.analysis_similarity_detail
    ADD CONSTRAINT FK_similarity_detail_analysis_result
    FOREIGN KEY (analysis_result_id) REFERENCES dbo.analysis_result(analysis_result_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_similarity_detail_compared_submission')
    ALTER TABLE dbo.analysis_similarity_detail
    ADD CONSTRAINT FK_similarity_detail_compared_submission
    FOREIGN KEY (compared_submission_id) REFERENCES dbo.submission(submission_id);

  -- ai_question_score -> analysis_result, guide_question
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ai_question_score_analysis_result')
    ALTER TABLE dbo.ai_question_score
    ADD CONSTRAINT FK_ai_question_score_analysis_result
    FOREIGN KEY (analysis_result_id) REFERENCES dbo.analysis_result(analysis_result_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ai_question_score_question')
    ALTER TABLE dbo.ai_question_score
    ADD CONSTRAINT FK_ai_question_score_question
    FOREIGN KEY (question_id) REFERENCES dbo.guide_question(question_id);

  -- ai_rubric_score -> analysis_result, guide_rubric_item
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ai_rubric_score_analysis_result')
    ALTER TABLE dbo.ai_rubric_score
    ADD CONSTRAINT FK_ai_rubric_score_analysis_result
    FOREIGN KEY (analysis_result_id) REFERENCES dbo.analysis_result(analysis_result_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ai_rubric_score_rubric_item')
    ALTER TABLE dbo.ai_rubric_score
    ADD CONSTRAINT FK_ai_rubric_score_rubric_item
    FOREIGN KEY (rubric_item_id) REFERENCES dbo.guide_rubric_item(rubric_item_id);

  -- ocr_page_result / diagram_check_result -> analysis_result
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ocr_page_result_analysis_result')
    ALTER TABLE dbo.ocr_page_result
    ADD CONSTRAINT FK_ocr_page_result_analysis_result
    FOREIGN KEY (analysis_result_id) REFERENCES dbo.analysis_result(analysis_result_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_diagram_check_result_analysis_result')
    ALTER TABLE dbo.diagram_check_result
    ADD CONSTRAINT FK_diagram_check_result_analysis_result
    FOREIGN KEY (analysis_result_id) REFERENCES dbo.analysis_result(analysis_result_id);

  -- final_mark -> submission, user
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_final_mark_submission')
    ALTER TABLE dbo.final_mark
    ADD CONSTRAINT FK_final_mark_submission
    FOREIGN KEY (submission_id) REFERENCES dbo.submission(submission_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_final_mark_lecturer')
    ALTER TABLE dbo.final_mark
    ADD CONSTRAINT FK_final_mark_lecturer
    FOREIGN KEY (lecturer_id) REFERENCES dbo.users(user_id);

  -- final_question_mark -> final_mark, guide_question
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_final_question_mark_final_mark')
    ALTER TABLE dbo.final_question_mark
    ADD CONSTRAINT FK_final_question_mark_final_mark
    FOREIGN KEY (final_mark_id) REFERENCES dbo.final_mark(final_mark_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_final_question_mark_question')
    ALTER TABLE dbo.final_question_mark
    ADD CONSTRAINT FK_final_question_mark_question
    FOREIGN KEY (question_id) REFERENCES dbo.guide_question(question_id);

  -- mark_alert -> submission, user (ack)
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_mark_alert_submission')
    ALTER TABLE dbo.mark_alert
    ADD CONSTRAINT FK_mark_alert_submission
    FOREIGN KEY (submission_id) REFERENCES dbo.submission(submission_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_mark_alert_ack_by')
    ALTER TABLE dbo.mark_alert
    ADD CONSTRAINT FK_mark_alert_ack_by
    FOREIGN KEY (acknowledged_by) REFERENCES dbo.users(user_id);

  -- mark_concern -> final_mark, user
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_mark_concern_final_mark')
    ALTER TABLE dbo.mark_concern
    ADD CONSTRAINT FK_mark_concern_final_mark
    FOREIGN KEY (final_mark_id) REFERENCES dbo.final_mark(final_mark_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_mark_concern_student')
    ALTER TABLE dbo.mark_concern
    ADD CONSTRAINT FK_mark_concern_student
    FOREIGN KEY (student_id) REFERENCES dbo.[user](user_id);

  -- concern_window -> assessment, user
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_concern_window_assessment')
    ALTER TABLE dbo.concern_window
    ADD CONSTRAINT FK_concern_window_assessment
    FOREIGN KEY (assessment_id) REFERENCES dbo.assessment(assessment_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_concern_window_created_by')
    ALTER TABLE dbo.concern_window
    ADD CONSTRAINT FK_concern_window_created_by
    FOREIGN KEY (created_by) REFERENCES dbo.[user](user_id);

  -- mark_revision_log -> final_mark, user
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_mark_revision_log_final_mark')
    ALTER TABLE dbo.mark_revision_log
    ADD CONSTRAINT FK_mark_revision_log_final_mark
    FOREIGN KEY (final_mark_id) REFERENCES dbo.final_mark(final_mark_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_mark_revision_log_lecturer')
    ALTER TABLE dbo.mark_revision_log
    ADD CONSTRAINT FK_mark_revision_log_lecturer
    FOREIGN KEY (lecturer_id) REFERENCES dbo.users(user_id);

  -- audit_log -> user
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_audit_log_actor')
    ALTER TABLE dbo.audit_log
    ADD CONSTRAINT FK_audit_log_actor
    FOREIGN KEY (actor_user_id) REFERENCES dbo.[user](user_id);

  -- evaluation_schedule -> assessment, location, user
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_evaluation_schedule_assessment')
    ALTER TABLE dbo.evaluation_schedule
    ADD CONSTRAINT FK_evaluation_schedule_assessment
    FOREIGN KEY (assessment_id) REFERENCES dbo.assessment(assessment_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_evaluation_schedule_location')
    ALTER TABLE dbo.evaluation_schedule
    ADD CONSTRAINT FK_evaluation_schedule_location
    FOREIGN KEY (location_id) REFERENCES dbo.evaluation_location(location_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_evaluation_schedule_created_by')
    ALTER TABLE dbo.evaluation_schedule
    ADD CONSTRAINT FK_evaluation_schedule_created_by
    FOREIGN KEY (created_by) REFERENCES dbo.users(user_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_evaluation_schedule_published_by')
    ALTER TABLE dbo.evaluation_schedule
    ADD CONSTRAINT FK_evaluation_schedule_published_by
    FOREIGN KEY (published_by) REFERENCES dbo.users(user_id);

  -- evaluation_slot -> evaluation_schedule
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_evaluation_slot_schedule')
    ALTER TABLE dbo.evaluation_slot
    ADD CONSTRAINT FK_evaluation_slot_schedule
    FOREIGN KEY (evaluation_schedule_id) REFERENCES dbo.evaluation_schedule(evaluation_schedule_id);

  -- evaluation_group_assignment -> evaluation_slot, user
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_evaluation_group_assignment_slot')
    ALTER TABLE dbo.evaluation_group_assignment
    ADD CONSTRAINT FK_evaluation_group_assignment_slot
    FOREIGN KEY (evaluation_slot_id) REFERENCES dbo.evaluation_slot(evaluation_slot_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_evaluation_group_assignment_assigned_by')
    ALTER TABLE dbo.evaluation_group_assignment
    ADD CONSTRAINT FK_evaluation_group_assignment_assigned_by
    FOREIGN KEY (assigned_by) REFERENCES dbo.users(user_id);

  -- evaluation_email_log -> evaluation_schedule, user
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_evaluation_email_log_schedule')
    ALTER TABLE dbo.evaluation_email_log
    ADD CONSTRAINT FK_evaluation_email_log_schedule
    FOREIGN KEY (evaluation_schedule_id) REFERENCES dbo.evaluation_schedule(evaluation_schedule_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_evaluation_email_log_recipient')
    ALTER TABLE dbo.evaluation_email_log
    ADD CONSTRAINT FK_evaluation_email_log_recipient
    FOREIGN KEY (recipient_user_id) REFERENCES dbo.[user](user_id);

  -- evaluation_conflict_log -> evaluation_schedule, user
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_evaluation_conflict_log_schedule')
    ALTER TABLE dbo.evaluation_conflict_log
    ADD CONSTRAINT FK_evaluation_conflict_log_schedule
    FOREIGN KEY (evaluation_schedule_id) REFERENCES dbo.evaluation_schedule(evaluation_schedule_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_evaluation_conflict_log_resolved_by')
    ALTER TABLE dbo.evaluation_conflict_log
    ADD CONSTRAINT FK_evaluation_conflict_log_resolved_by
    FOREIGN KEY (resolved_by) REFERENCES dbo.[user](user_id);

  -- exam_timetable -> user
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_exam_timetable_created_by')
    ALTER TABLE dbo.exam_timetable
    ADD CONSTRAINT FK_exam_timetable_created_by
    FOREIGN KEY (created_by) REFERENCES dbo.users(user_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_exam_timetable_published_by')
    ALTER TABLE dbo.exam_timetable
    ADD CONSTRAINT FK_exam_timetable_published_by
    FOREIGN KEY (published_by) REFERENCES dbo.[user](user_id);

  -- exam_session -> exam_timetable, subject, exam_room
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_exam_session_timetable')
    ALTER TABLE dbo.exam_session
    ADD CONSTRAINT FK_exam_session_timetable
    FOREIGN KEY (exam_timetable_id) REFERENCES dbo.exam_timetable(exam_timetable_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_exam_session_subject')
    ALTER TABLE dbo.exam_session
    ADD CONSTRAINT FK_exam_session_subject
    FOREIGN KEY (subject_id) REFERENCES dbo.subject(subject_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_exam_session_room')
    ALTER TABLE dbo.exam_session
    ADD CONSTRAINT FK_exam_session_room
    FOREIGN KEY (room_id) REFERENCES dbo.exam_room(room_id);

  -- exam_capacity_tracking -> exam_session, exam_room
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_exam_capacity_tracking_session')
    ALTER TABLE dbo.exam_capacity_tracking
    ADD CONSTRAINT FK_exam_capacity_tracking_session
    FOREIGN KEY (exam_session_id) REFERENCES dbo.exam_session(exam_session_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_exam_capacity_tracking_room')
    ALTER TABLE dbo.exam_capacity_tracking
    ADD CONSTRAINT FK_exam_capacity_tracking_room
    FOREIGN KEY (room_id) REFERENCES dbo.exam_room(room_id);

  -- exam_conflict_log -> exam_session, user
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_exam_conflict_log_session')
    ALTER TABLE dbo.exam_conflict_log
    ADD CONSTRAINT FK_exam_conflict_log_session
    FOREIGN KEY (exam_session_id) REFERENCES dbo.exam_session(exam_session_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_exam_conflict_log_resolved_by')
    ALTER TABLE dbo.exam_conflict_log
    ADD CONSTRAINT FK_exam_conflict_log_resolved_by
    FOREIGN KEY (resolved_by) REFERENCES dbo.[user](user_id);

  -- exam_notification_log -> exam_session, user
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_exam_notification_log_session')
    ALTER TABLE dbo.exam_notification_log
    ADD CONSTRAINT FK_exam_notification_log_session
    FOREIGN KEY (exam_session_id) REFERENCES dbo.exam_session(exam_session_id);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_exam_notification_log_user')
    ALTER TABLE dbo.exam_notification_log
    ADD CONSTRAINT FK_exam_notification_log_user
    FOREIGN KEY (user_id) REFERENCES dbo.[user](user_id);

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;

  DECLARE @Err nvarchar(4000) = ERROR_MESSAGE();
  RAISERROR('DDL failed: %s', 16, 1, @Err);
END CATCH;
GO
