const sql = require('mssql');

const config = {
    user: 'structa_user_N',
    password: 'Structa@123',
    server: 'localhost',
    port: 1433,
    database: 'Structal_Q_platform',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

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
};