require("dotenv").config();

const app = require("./app");
const { poolConnect } = require("./config/db");
const { startConcernWindowScheduler } = require("./modules/concern/concernWindowAutomation");
const { getSqlConnectionHint } = require("./utils/sqlConnectionHint");

const PORT = process.env.PORT || 5000;

// Always bind HTTP immediately so the client gets responses (401/503) instead of a stalled connection
// when SQL is slow or misconfigured. DB is still required for /api/* data routes.
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT} (API ready; DB connects in background)`);
});

poolConnect
    .then(() => {
        console.log("DB connected successfully");
        try {
            startConcernWindowScheduler();
        } catch (e) {
            console.warn("Concern scheduler skipped:", e.message);
        }
    })
    .catch((err) => {
        console.error("Database connection failed:", err.message);
        console.error(getSqlConnectionHint(err));
    });