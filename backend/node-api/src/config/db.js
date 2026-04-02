require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'structa_user',
    password: process.env.DB_PASSWORD || 'Structa@123',
    server: process.env.DB_SERVER || 'localhost',
    port: Number(process.env.DB_PORT) || 1433,
    database: process.env.DB_NAME || 'Structal_Q_platform',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false'
    }
};

module.exports = config;
