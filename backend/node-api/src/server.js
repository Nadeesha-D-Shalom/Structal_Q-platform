const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { poolConnect } = require('./config/db');
const apiRoutes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());


app.use('/api', apiRoutes);
// ================= DATABASE =================
poolConnect
    .then(() => console.log("DB Connected Successfully"))
    .catch(err => console.error("Database connection failed:", err));


// ================= HEALTH =================
app.get('/health', (req, res) => {
    res.json({
        status: "Backend running",
        port: PORT
    });
});


// ================= ROOT =================
app.get('/', (req, res) => {
    res.send("StructaIQ Backend API running");
});


// ================= ERROR =================
app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR:", err.stack);

    res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: err.message
    });
});


// ================= START =================
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});