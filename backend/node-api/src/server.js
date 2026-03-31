const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const config = require('./config/db');
const apiRoutes = require('./routes/index');

const app = express();
/** Default 5000 — matches frontend `timetableService` (CRA uses 3000). */
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database Connection
sql.connect(config)
    .then(() => {
        console.log("Database connected successfully!");
    })
    .catch(err => {
        console.error("Database connection failed:", err);
    });

app.use('/api', apiRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: "Backend running",
        database: "Connected",
        port: PORT
    });
});

// Root
app.get('/', (req, res) => {
    res.send("StructaIQ Backend API is running");
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Something went wrong!",
        error: err.message
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});