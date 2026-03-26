require("dotenv").config();

module.exports = {
    DB_SERVER: process.env.DB_SERVER,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    ML_SERVICE_URL: process.env.ML_SERVICE_URL
};