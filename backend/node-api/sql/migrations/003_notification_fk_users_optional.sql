/*
  Optional: align notification.user_id FK with dbo.users (app auth table).
  Run only if migration 001 created FK to dbo.[user] and inserts fail against your DB.

  Idempotent: drops FK_notification_user if present; adds FK_notification_users if missing.
*/
IF OBJECT_ID(N'dbo.notification', N'U') IS NULL
  OR OBJECT_ID(N'dbo.users', N'U') IS NULL
  RETURN;

IF EXISTS (
  SELECT 1 FROM sys.foreign_keys
  WHERE parent_object_id = OBJECT_ID(N'dbo.notification') AND name = N'FK_notification_user'
)
BEGIN
  ALTER TABLE dbo.notification DROP CONSTRAINT FK_notification_user;
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_notification_users'
)
BEGIN
  ALTER TABLE dbo.notification
  ADD CONSTRAINT FK_notification_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id);
END
GO
