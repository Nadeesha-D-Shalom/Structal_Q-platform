/*
  Sample mark_concern row for lecturer Review Concerns UI testing.
  Idempotent: skips if CON-DEMO-001 already exists.

  Prerequisites: dbo.users, dbo.submission with at least one row.
*/
SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.mark_concern', N'U') IS NULL
  OR OBJECT_ID(N'dbo.submission', N'U') IS NULL
  OR OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
  PRINT 'mark_concern / submission / users missing — skip sample data.';
  RETURN;
END

IF NOT EXISTS (SELECT 1 FROM dbo.mark_concern WHERE concern_id = N'CON-DEMO-001')
BEGIN
  INSERT INTO dbo.mark_concern (
    concern_id,
    student_id,
    student_name,
    student_email,
    academic_year,
    submission_id,
    concern_message,
    priority_level,
    concern_status
  )
  SELECT TOP 1
    N'CON-DEMO-001',
    s.student_id,
    LTRIM(RTRIM(COALESCE(u.first_name, N'') + N' ' + COALESCE(u.last_name, N'Demo Student'))),
    COALESCE(u.email, N'student@example.com'),
    N'2024/2025',
    s.submission_id,
    N'Sample concern: Please verify the diagram similarity score against the rubric. I believe part B should receive partial credit.',
    N'Medium',
    N'Pending'
  FROM dbo.submission s
  INNER JOIN dbo.users u ON u.user_id = s.student_id
  ORDER BY s.submission_id DESC;
END

PRINT 'Sample concern CON-DEMO-001: applied or already present.';
GO
