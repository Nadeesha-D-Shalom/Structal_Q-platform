const express = require("express");
const cors = require("cors");

const app = express();


app.use(cors());
app.use(express.json());


const evaluationRoutes = require("./routes/evaluation.routes");
app.use("/api/evaluation", evaluationRoutes);

module.exports = app;