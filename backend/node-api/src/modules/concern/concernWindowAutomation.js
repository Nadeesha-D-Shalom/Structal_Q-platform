const cron = require("node-cron");
const { pool } = require("../../config/db");

const closeConcernWindows = async () => {
  try {
    const result = await pool.request().query(`
      UPDATE final_mark
      SET
        concern_window_open = 0
      WHERE marking_status      = 'PUBLISHED'
        AND concern_window_open = 1
        AND published_at IS NOT NULL
        AND DATEDIFF(HOUR, published_at, GETDATE()) >= 48
    `);

    const closed = result.rowsAffected[0];
    if (closed > 0) {
      console.log(
        `[ConcernWindow] Closed ${closed} concern window(s) at ${new Date().toISOString()}`
      );
    }
  } catch (err) {
    console.error("[ConcernWindow] Scheduler error:", err);
  }
};

const startConcernWindowScheduler = () => {
    //runs every 10 minutes
    cron.schedule("*/10 * * * *", async () => {
        await closeConcernWindows();
    });

    console.log("[ConcernWindow] Scheduler started — checks every 10 minutes");

    closeConcernWindows();
};

module.exports = { startConcernWindowScheduler };