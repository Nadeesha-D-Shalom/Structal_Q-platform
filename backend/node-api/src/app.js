require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");

const routes = require("./routes");
const authRoutes = require("./modules/auth/auth.routes");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || "default_secret_change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        sameSite: "lax"
    }
}));

app.use("/api/auth", authRoutes);
app.use("/api", routes);

app.get("/health", (req, res) => {
    res.json({ status: "Backend running" });
});

module.exports = app;