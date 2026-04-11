const bcrypt = require("bcryptjs");
const { pool, sql } = require("../../config/db");

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const login = String(email).trim();
    const result = await pool
      .request()
      .input("login", sql.NVarChar, login.toLowerCase())
      .query(`
        SELECT user_id, first_name, last_name, email, password_hash, role, registration_no
        FROM dbo.[user]
        WHERE LOWER(LTRIM(RTRIM(email))) = @login
           OR LOWER(CAST(registration_no AS NVARCHAR(64))) = @login
      `);

    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    let ok = false;
    const hash = user.password_hash;
    if (hash && String(hash).startsWith("$2")) {
      ok = await bcrypt.compare(password, hash);
    } else if (hash != null) {
      ok = password === String(hash);
    }

    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const safe = {
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      registration_no: user.registration_no,
    };

    res.json({ success: true, user: safe });
  } catch (err) {
    next(err);
  }
};
