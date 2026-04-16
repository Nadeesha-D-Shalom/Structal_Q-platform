require("dotenv").config();

const app = require("./app");
const { poolConnect } = require("./config/db");
const { startConcernWindowScheduler } = require("./modules/concern/concernWindowAutomation");

const PORT = process.env.PORT || 5000;

poolConnect
    .then(() => {
        console.log("DB Connected Successfully");
        startConcernWindowScheduler();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Database connection failed:", err);
    });