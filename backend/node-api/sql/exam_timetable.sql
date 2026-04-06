-- Examination timetable table for Structal_Q_platform (MSSQL).
-- Run once against your database if the table does not exist.

IF NOT EXISTS (
  SELECT 1 FROM sys.tables WHERE name = 'exam_timetable'
)
BEGIN
  CREATE TABLE exam_timetable (
    id INT IDENTITY(1,1) PRIMARY KEY,
    subject NVARCHAR(300) NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    hall NVARCHAR(200) NOT NULL,
    status NVARCHAR(20) NOT NULL
      CONSTRAINT DF_exam_timetable_status DEFAULT N'Draft'
      CONSTRAINT CK_exam_timetable_status CHECK (status IN (N'Draft', N'Published')),
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );

  CREATE INDEX IX_exam_timetable_date_hall ON exam_timetable (exam_date, hall);
END
GO
