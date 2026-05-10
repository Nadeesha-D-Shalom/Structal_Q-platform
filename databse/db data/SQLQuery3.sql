select * from users;

select * from analysis_result;
select * from ai_question_score;
select * from ai_rubric_score;
SELECT * FROM submission;
SELECT * FROM file_storage ;
select * from assessment;

SELECT submission_id, file_id, assessment_id
FROM submission
ORDER BY submission_id DESC;


SELECT * FROM analysis_result ORDER BY analysis_result_id DESC;

SELECT TOP 1 * FROM assessment;

ALTER TABLE assessment
ADD concern_window_open BIT DEFAULT 0;

UPDATE users
SET 
    first_name = 'Saman',
    last_name = 'Jayawardhana',
    email = 'saman.j@gamil.com'
WHERE user_id = 2;

DELETE FROM file_storage
WHERE file_id IN (6, 7);


select * from analysis_result;

SELECT * FROM submission;
SELECT * FROM file_storage ;


ALTER TABLE analysis_result
ADD manual_marks DECIMAL(10,2) NULL;


INSERT INTO users (
    first_name,
    last_name,
    email,
    password_hash,
    role,
    registration_no,
    program_id,
    status
)
VALUES
('Nimal', 'Soisa', 'nimal.s@gmail.com', '1qaz2wsx', 'STUDENT', 'IT24100000', 1, 'ACTIVE'),
('Kamal', 'Smith', 'kamal.s@gmail.com', '2wsx1qaz', 'LECTURER', '25146', NULL, 'ACTIVE')

select * from users;
select * from submission_deletion_audit;


IF OBJECT_ID(N'dbo.users', N'U') IS NULL
  RETURN;

IF OBJECT_ID(N'dbo.submission_deletion_audit', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.submission_deletion_audit (
    submission_deletion_audit_id BIGINT NOT NULL PRIMARY KEY IDENTITY(1, 1),
    submission_id BIGINT NOT NULL,
    assessment_id BIGINT NULL,
    student_id BIGINT NULL,
    original_file_name NVARCHAR(512) NULL,
    assessment_title NVARCHAR(500) NULL,
    deleted_by_user_id BIGINT NOT NULL,
    reason NVARCHAR(MAX) NOT NULL,
    deleted_at DATETIME2 NOT NULL CONSTRAINT DF_submission_deletion_audit_deleted_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_submission_deletion_audit_user
      FOREIGN KEY (deleted_by_user_id) REFERENCES dbo.users(user_id)
  );

  CREATE INDEX IX_submission_deletion_audit_assessment
    ON dbo.submission_deletion_audit(assessment_id, deleted_at DESC);

  CREATE INDEX IX_submission_deletion_audit_deleter
    ON dbo.submission_deletion_audit(deleted_by_user_id, deleted_at DESC);
END
GO



CREATE TABLE group_member (
  group_member_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES student_group(group_id),
  student_id BIGINT NOT NULL REFERENCES [users](user_id),
  role_in_group NVARCHAR(50) NULL,
  UNIQUE (group_id, student_id)
);


-- Idempotent: create only if not exists (run via migration tool you use)
CREATE TABLE [notification] (
  [notification_id] BIGINT PRIMARY KEY IDENTITY(1,1),
  [user_id] BIGINT NOT NULL,
  [title] NVARCHAR(255) NOT NULL,
  [message] NVARCHAR(MAX) NOT NULL,
  [type] NVARCHAR(50) NOT NULL,          -- e.g. ASSIGNMENT_CREATED, MARKS_PUBLISHED, CONCERN_WINDOW_OPENED
  [is_read] BIT NOT NULL DEFAULT 0,
  [created_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_notification_user FOREIGN KEY ([user_id]) REFERENCES [users]([user_id])
);
CREATE INDEX IX_notification_user_unread ON [notification]([user_id], [is_read], [created_at] DESC);


CREATE TABLE [student_group] (
  [group_id] BIGINT PRIMARY KEY IDENTITY(1,1),
  [assessment_id] BIGINT NOT NULL,
  [group_name] NVARCHAR(255) NULL,
  [created_at] DATETIME2 NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_student_group_assessment UNIQUE ([assessment_id], [group_name]), -- or UNIQUE(assessment_id) if one group per assessment — match SRS
  CONSTRAINT FK_sg_assessment FOREIGN KEY ([assessment_id]) REFERENCES [assessment]([assessment_id])
);

CREATE TABLE [group_member] (
  [group_id] BIGINT NOT NULL,
  [student_id] BIGINT NOT NULL,
  [joined_at] DATETIME2 NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_group_member PRIMARY KEY ([group_id], [student_id]),
  CONSTRAINT FK_gm_group FOREIGN KEY ([group_id]) REFERENCES [student_group]([group_id]),
  CONSTRAINT FK_gm_student FOREIGN KEY ([student_id]) REFERENCES [users]([user_id])
);
    


IF COL_LENGTH('dbo.exam_timetable', 'timetable_type') IS NULL
BEGIN
    ALTER TABLE dbo.exam_timetable ADD timetable_type NVARCHAR(50) NULL;
END
GO

IF COL_LENGTH('dbo.exam_timetable', 'section_name') IS NULL
BEGIN
    ALTER TABLE dbo.exam_timetable ADD section_name NVARCHAR(100) NULL;
END
GO


SELECT * FROM exam_session;
SELECT * FROM exam_room ;
select * from exam_timetable;

-- 1) Confirm exam_session structure currently in DB
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'exam_session'
ORDER BY ORDINAL_POSITION;

-- 2) Timetables with session counts (publication sanity check)
SELECT
    et.exam_timetable_id,
    et.title,
    et.status,
    et.timetable_type,
    et.academic_year,
    et.semester,
    et.section_name,
    COUNT(es.exam_session_id) AS session_count
FROM exam_timetable et
LEFT JOIN exam_session es ON es.exam_timetable_id = et.exam_timetable_id
GROUP BY
    et.exam_timetable_id, et.title, et.status,
    et.timetable_type, et.academic_year, et.semester, et.section_name
ORDER BY et.exam_timetable_id DESC;

-- 3) Session details
SELECT
    es.exam_session_id,
    es.exam_timetable_id,
    es.subject_id,
    es.room_id,
    es.exam_date,
    es.start_time,
    es.end_time,
    es.expected_students_count,
    es.session_status,
    es.created_at,
    es.updated_at
FROM exam_session es
ORDER BY es.exam_session_id DESC;
