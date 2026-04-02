-- Seed a system user so exam_timetable.created_by (NOT NULL) can be satisfied.
-- Run once against Structal_Q_platform (or your DB name) in SSMS / Azure Data Studio / sqlcmd.

IF NOT EXISTS (SELECT 1 FROM dbo.[user])
BEGIN
  INSERT INTO dbo.[user] (
    email,
    role,
    status,
    first_name,
    last_name,
    created_at,
    updated_at
  )
  VALUES (
    N'admin@structal.local',
    N'ADMIN',
    N'ACTIVE',
    N'System',
    N'Admin',
    GETDATE(),
    GETDATE()
  );
  PRINT N'Inserted default admin user (admin@structal.local).';
END
ELSE
BEGIN
  PRINT N'dbo.[user] already has rows; no insert. If you still see "no users", check your database name / connection.';
END
GO
