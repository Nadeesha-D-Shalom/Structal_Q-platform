const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { poolConnect } = require('./config/db');
const routes = require('./routes');

        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// ROUTES
app.use('/api', routes);

// HEALTH
app.get('/health', (req, res) => {
    res.json({
        status: 'Backend running',
        port: PORT
    });
});

// ROOT
app.get('/', (req, res) => {
    res.send('StructaIQ Backend API running');
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR:', err.stack);

    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: err.message
    });
});

// START SERVER AFTER DB CONNECT
poolConnect
    .then(() => {
        console.log('DB Connected Successfully');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });
