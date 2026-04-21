-- Run once against your StructaL Q database (additive only).
-- Creates in-app notification storage for students/lecturers.

IF OBJECT_ID(N'dbo.notification', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[notification] (
    [notification_id] BIGINT NOT NULL PRIMARY KEY IDENTITY(1, 1),
    [user_id] BIGINT NOT NULL,
    [title] NVARCHAR(255) NOT NULL,
    [message] NVARCHAR(MAX) NOT NULL,
    [type] NVARCHAR(50) NOT NULL,
    [is_read] BIT NOT NULL CONSTRAINT DF_notification_is_read DEFAULT (0),
    [created_at] DATETIME2 NOT NULL CONSTRAINT DF_notification_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [FK_notification_user] FOREIGN KEY ([user_id]) REFERENCES [dbo].[user]([user_id])
  );
  CREATE INDEX [IX_notification_user_unread]
    ON [dbo].[notification]([user_id], [is_read], [created_at] DESC);
END
GO
