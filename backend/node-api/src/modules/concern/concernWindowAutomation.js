const cron = require("node-cron");

/**
 * Concern eligibility is computed from published_at + 48h (see viewMarks.controller,
 * submission.service) and from mark_concern (duplicate check). No persisted
 * concern_window_open column is not required on final_mark — avoids DB errors when that
 * column was never migrated.
 */
const closeConcernWindows = async () => {
  try {
    /* no-op: time window enforced in API responses; optional future: notify / audit */
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