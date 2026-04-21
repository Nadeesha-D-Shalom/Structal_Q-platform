const cron = require("node-cron");
const { pool, poolConnect } = require("../../config/db");

/**
 * Marks expired rows as CLOSED when `status` column exists; otherwise no-op (eligibility is still enforced in APIs).
 */
const closeExpiredConcernWindows = async () => {
  try {
    await poolConnect;
    const cols = await pool.request().query(`
      SELECT c.name
      FROM sys.columns c
      INNER JOIN sys.tables t ON c.object_id = t.object_id
      WHERE t.name = 'concern_window' AND SCHEMA_NAME(t.schema_id) = 'dbo';
    `);
    const names = new Set((cols.recordset || []).map((r) => r.name));
    if (!names.has("status") || !names.has("open_until")) return;

    await pool.request().query(`
      UPDATE cw
      SET status = N'CLOSED'
      FROM concern_window cw
      WHERE cw.open_until IS NOT NULL
        AND cw.open_until < GETDATE()
        AND ISNULL(cw.status, N'') <> N'CLOSED';
    `);
  } catch (err) {
    console.error("[ConcernWindow] closeExpiredConcernWindows:", err.message);
  }
};

const startConcernWindowScheduler = () => {
  cron.schedule("*/10 * * * *", async () => {
    await closeExpiredConcernWindows();
  });

  console.log("[ConcernWindow] Scheduler started — closes expired windows every 10 minutes");

  closeExpiredConcernWindows();
};

module.exports = { startConcernWindowScheduler, closeExpiredConcernWindows };
