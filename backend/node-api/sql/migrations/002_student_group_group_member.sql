-- StructaL Q — student_group + group_member (aligns with SSMS schema)
-- Run only on databases that do not yet have these tables.

IF OBJECT_ID(N'dbo.student_group', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.student_group (
    group_id BIGINT NOT NULL CONSTRAINT PK_student_group PRIMARY KEY IDENTITY(1, 1),
    assessment_id BIGINT NOT NULL,
    group_name NVARCHAR(510) NULL,
    created_at DATETIME2 NULL CONSTRAINT DF_student_group_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_student_group_assessment FOREIGN KEY (assessment_id)
      REFERENCES dbo.assessment (assessment_id)
  );
  CREATE UNIQUE NONCLUSTERED INDEX UQ_student_group_assessment
    ON dbo.student_group (assessment_id, group_name);
END
GO

IF OBJECT_ID(N'dbo.group_member', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.group_member (
    group_member_id BIGINT NOT NULL CONSTRAINT PK_group_member PRIMARY KEY IDENTITY(1, 1),
    group_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    role_in_group NVARCHAR(100) NULL,
    CONSTRAINT FK_group_member_group FOREIGN KEY (group_id)
      REFERENCES dbo.student_group (group_id),
    CONSTRAINT FK_group_member_student FOREIGN KEY (student_id)
      REFERENCES dbo.[user] (user_id)
  );
END
GO
