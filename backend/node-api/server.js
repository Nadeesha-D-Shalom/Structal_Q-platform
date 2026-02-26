const express = require('express');
const concernRoutes = require('./src/routes/concernRoutes');

const app = express();
app.use(express.json()); // Parses JSON bodies

// Link the routes
app.use('/api/concerns', concernRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});