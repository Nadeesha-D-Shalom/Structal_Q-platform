const sql = require("mssql");
require("dotenv").config();
const { resolveDbPassword } = require("../utils/secretCrypto");

const config = {
    user: process.env.DB_USER,
    password: resolveDbPassword(),
    server: process.env.DB_SERVER,
    port: Number(process.env.DB_PORT) || 1433,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// CREATE CONNECTION POOL
const pool = new sql.ConnectionPool(config);

// CONNECT PROMISE
const poolConnect = pool.connect();

module.exports = {
    pool,
    sql,
    poolConnect
};