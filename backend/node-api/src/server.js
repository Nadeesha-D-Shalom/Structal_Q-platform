require("dotenv").config();

const app = require("./app");
const { poolConnect } = require("./config/db");

const PORT = process.env.PORT || 5000;

poolConnect
    .then(() => {
        console.log("DB Connected Successfully");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("Database connection failed:", err);
    });