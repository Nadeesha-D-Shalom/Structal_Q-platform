const express = require('express');
const routes = require('./routes');


const app = express();

app.use(express.json());

app.use('/api', routes);


app.get('/health', (req, res) => {
    res.json({ status: "Backend running" });
});

module.exports = app;