require('dotenv').config();

const sql = require('mssql');
const config = require('./config/db');
const app = require('./app');

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
    try {
        await sql.connect(config);
        console.log('Database connected successfully!');

        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        server.on('error', (err) => {
            console.error(`Server failed to start on port ${PORT}:`, err.message);
            process.exit(1);
        });
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
}

startServer();


