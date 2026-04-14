<<<<<<< HEAD
const sql = require('mssql');

const config = {
    user: 'structa_user_N',
    password: 'Structa@123',
    server: 'localhost',
    port: 1433,
    database: 'Structal_Q_platform',
=======
const sql = require("mssql");
require("dotenv").config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: Number(process.env.DB_PORT) || 1433,
    database: process.env.DB_NAME,
>>>>>>> main
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

<<<<<<< HEAD
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log("✅ DB Connected");
        return pool;
    })
    .catch(err => console.log("❌ DB Error:", err));

module.exports = {
    sql,
    poolPromise
=======
// CREATE CONNECTION POOL
const pool = new sql.ConnectionPool(config);

// CONNECT PROMISE
const poolConnect = pool.connect();

module.exports = {
    pool,
    sql,
    poolConnect
>>>>>>> main
};