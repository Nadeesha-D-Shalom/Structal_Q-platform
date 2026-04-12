const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool, sql } = require("../../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "structal-dev-secret-change-in-production";
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

function normalizeRole(role) {
  const r = String(role || "").toLowerCase();
  if (r.includes("student")) return "student";
  if (r.includes("lecturer") || r.includes("teacher")) return "lecturer";
  if (r.includes("admin")) return "admin";
  return r || "student";
}

function buildSessionUser(row) {
  const role = normalizeRole(row.role);
  const first = row.first_name || "";
  const last = row.last_name || "";
  const displayName = `${first} ${last}`.trim() || row.email || "User";
  const uid = row.user_id;
  const base = {
    user_id: uid,
    name: displayName,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    role,
    registration_no: row.registration_no != null ? String(row.registration_no) : undefined,
    academic_year: row.academic_year || null,
  };
  if (role === "student") {
    return {
      ...base,
      student_id: uid,
      student_name: displayName,
      student_email: row.email,
    };
  }
  if (role === "lecturer" || role === "admin") {
    return {
      ...base,
      lecturer_id: uid,
    };
  }
  return base;
}

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

    const sessionUser = buildSessionUser(user);
    const token = jwt.sign(
      {
        sub: user.user_id,
        role: sessionUser.role,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      success: true,
      token,
      user: sessionUser,
    });
  } catch (err) {
    next(err);
  }
};

exports.session = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const token = auth.slice(7);
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const result = await pool.request().input("id", sql.Int, decoded.sub).query(`
      SELECT user_id, first_name, last_name, email, role, registration_no
      FROM dbo.[user]
      WHERE user_id = @id
    `);

    const row = result.recordset[0];
    if (!row) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      ...buildSessionUser(row),
    });
  } catch (err) {
    next(err);
  }
};

/** Optional: verify JWT and attach req.authUser — used by future protected routes */
exports.attachUserFromToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    req.authUser = null;
    return next();
  }
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    req.authUser = decoded;
  } catch {
    req.authUser = null;
  }
  next();
};
