const sql = require("mssql");

const config = {
  user: "navindu",
  password: "12345",
  server: "localhost",
  database: "Structal_Q_Platform",
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function connectDB() {
  try {
    await sql.connect(config);
    console.log("Connected to MSSQL ✅ ");
  } catch (err) {
    console.error("❌ DB connection failed:", err);
  }
}

module.exports = { sql, connectDB };