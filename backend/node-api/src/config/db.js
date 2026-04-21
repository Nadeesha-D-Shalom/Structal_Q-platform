const sql = require("mssql");
require("dotenv").config();
const { resolveDbPassword } = require("../utils/secretCrypto");

const config = {
    user: process.env.DB_USER,
    password: resolveDbPassword(),
    server: process.env.DB_SERVER,
    port: Number(process.env.DB_PORT) || 1433,
    database: process.env.DB_NAME,
    pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 30000,
    },
    options: {
        encrypt: false,
        trustServerCertificate: true,
        // Fail fast instead of hanging when SQL Server is unreachable or wrong host
        connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 20000,
        requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT_MS) || 45000,
        enableArithAbort: true,
    },
};

if (!config.server || !config.database) {
    console.error(
        "[db] Missing DB_SERVER or DB_NAME in .env — API routes that use SQL will fail."
    );
}

const pool = new sql.ConnectionPool(config);

const poolConnect = pool.connect().catch((err) => {
    console.error("[db] Initial pool.connect() failed:", err.message);
    throw err;
});

module.exports = {
    pool,
    sql,
    poolConnect,
    /** Same options passed to `new sql.ConnectionPool(...)` — for `sql.connect()` in legacy modules. */
    dbConfig: config,
};