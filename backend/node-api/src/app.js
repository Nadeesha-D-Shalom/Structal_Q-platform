const express = require('express');
const routes = require('./routes');
const cors = require('cors');


const app = express();

app.use(express.json());
app.use(cors());

app.use('/api', routes);


app.get('/health', (req, res) => {
    res.json({ status: 'Backend running' });
});

app.get('/', (req, res) => {
    res.send('StructaIQ Backend API is running');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: err.message
    });
});

module.exports = app;
