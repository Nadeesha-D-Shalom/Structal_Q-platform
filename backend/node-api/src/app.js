const express = require('express');
const routes = require('./routes');

const app = express();

app.use(express.json());

// Main API prefix
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: "Backend running" });
});

module.exports = app;