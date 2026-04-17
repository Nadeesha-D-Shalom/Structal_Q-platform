/**
 * Maps mssql/tedious connection errors to actionable console hints.
 * Password expiry is enforced by SQL Server — app code cannot bypass it.
 */
function getSqlConnectionHint(err) {
  if (!err) {
    return "Database connection failed (no error object). Check DB_* variables in .env.";
  }
  const combined = [
    err.message,
    err.originalError && err.originalError.message,
    String(err),
  ]
    .filter(Boolean)
    .join(" ");

  if (/password.*expired/i.test(combined) || /account has expired/i.test(combined)) {
    return (
      "SQL Server rejected login: PASSWORD FOR THIS SQL LOGIN HAS EXPIRED.\n" +
      "  Fix: In SSMS (or Azure Data Studio), connect as an admin → Security → Logins → " +
      "your user → reset password (or uncheck 'Enforce password expiration').\n" +
      "  Then update DB_PASSWORD (or DB_PASSWORD_ENC + DB_PASSWORD_KEY)\n" +
      "  in backend/node-api/.env and restart the API."
    );
  }

  if (/Login failed for user/i.test(combined)) {
    return (
      "SQL Server login failed (wrong user/password or database).\n" +
      "  Check DB_USER, DB_PASSWORD or DB_PASSWORD_ENC, DB_SERVER,\n" +
      "  DB_NAME, DB_PORT in backend/node-api/.env."
    );
  }

  if (/ECONNREFUSED|getaddrinfo|ENOTFOUND/i.test(combined)) {
    return (
      "Cannot reach SQL Server host.\n" +
      "  Check DB_SERVER / DB_PORT, firewall, and that SQL Server allows TCP/IP."
    );
  }

  return combined.slice(0, 500);
}

module.exports = { getSqlConnectionHint };
