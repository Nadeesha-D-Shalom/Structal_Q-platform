const { pool, poolConnect, sql } = require("../../config/db");
const bcrypt = require("bcrypt");
const { normalizeRole } = require("../../utils/roleNormalize");

async function comparePassword(password, storedHash) {
  if (!storedHash) return false;
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
    return bcrypt.compare(password, storedHash);
  }
  return password === storedHash;
}

exports.getProfileWithModules = async (userId) => {
  await poolConnect;

  const idNum = userId != null && userId !== "" ? Number(userId) : NaN;
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return null;
  }

  const u = await pool
    .request()
    .input("id", sql.BigInt, idNum)
    .query(`
      SELECT
        user_id,
        first_name,
        last_name,
        email,
        role,
        registration_no,
        program_id,
        status,
        created_at,
        updated_at,
        last_login_at
      FROM users
      WHERE user_id = @id;
    `);

  if (!u.recordset?.length) return null;

  const user = u.recordset[0];
  const role = normalizeRole(user.role);
  let modules = [];

  try {
    if (role === "student") {
      const m = await pool
        .request()
        .input("sid", sql.BigInt, idNum)
        .query(`
          SELECT DISTINCT
            s.subject_id,
            s.subject_code,
            s.subject_name,
            so.academic_year,
            so.semester,
            so.intake_name
          FROM submission sub
          INNER JOIN assessment a ON a.assessment_id = sub.assessment_id
          INNER JOIN subject_offering so ON so.offering_id = a.offering_id
          INNER JOIN subject s ON s.subject_id = so.subject_id
          WHERE sub.student_id = @sid;
        `);
      const rows = m.recordset || [];
      rows.sort((a, b) =>
        String(a.subject_name || "").localeCompare(String(b.subject_name || ""), undefined, {
          sensitivity: "base",
        })
      );
      modules = rows;
    } else if (role === "lecturer") {
      const m = await pool
        .request()
        .input("lid", sql.BigInt, idNum)
        .query(`
          SELECT DISTINCT
            s.subject_id,
            s.subject_code,
            s.subject_name,
            so.academic_year,
            so.semester,
            so.intake_name
          FROM assessment a
          INNER JOIN subject_offering so ON so.offering_id = a.offering_id
          INNER JOIN subject s ON s.subject_id = so.subject_id
          WHERE a.created_by = @lid;
        `);
      const rows = m.recordset || [];
      rows.sort((a, b) =>
        String(a.subject_name || "").localeCompare(String(b.subject_name || ""), undefined, {
          sensitivity: "base",
        })
      );
      modules = rows;
    }
  } catch (modErr) {
    console.error("[profile] modules query failed (profile still returned):", modErr.message);
    modules = [];
  }

  return { user, modules };
};

exports.changePassword = async (userId, currentPassword, newPassword) => {
  await poolConnect;
  const row = await pool
    .request()
    .input("id", sql.BigInt, userId)
    .query(`SELECT password_hash FROM users WHERE user_id = @id`);

  if (!row.recordset?.length) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const stored = row.recordset[0].password_hash;
  const ok = await comparePassword(String(currentPassword || ""), stored);
  if (!ok) {
    const err = new Error("Current password is incorrect");
    err.status = 400;
    throw err;
  }

  const hash = await bcrypt.hash(String(newPassword), 10);
  await pool
    .request()
    .input("id", sql.BigInt, userId)
    .input("ph", sql.NVarChar(255), hash)
    .query(`
      UPDATE users
      SET password_hash = @ph, updated_at = GETDATE()
      WHERE user_id = @id;
    `);

  return true;
};

exports.createUserByLecturer = async (payload) => {
  const {
    role: rawRole,
    first_name,
    last_name,
    email,
    password,
    registration_no,
    program_id,
  } = payload || {};

  const emailNorm = String(email || "").trim().toLowerCase();
  if (!emailNorm || !password || String(password).length < 6) {
    const err = new Error("Valid email and password (min 6 characters) are required");
    err.status = 400;
    throw err;
  }
  if (!first_name?.trim() || !last_name?.trim() || !registration_no?.trim()) {
    const err = new Error("First name, last name, and registration number are required");
    err.status = 400;
    throw err;
  }

  const r = String(rawRole || "").trim().toUpperCase();
  if (r !== "STUDENT" && r !== "LECTURER") {
    const err = new Error("Role must be STUDENT or LECTURER");
    err.status = 400;
    throw err;
  }

  await poolConnect;

  const dup = await pool
    .request()
    .input("em", sql.NVarChar(255), emailNorm)
    .query(`SELECT TOP 1 user_id FROM users WHERE LOWER(LTRIM(RTRIM(email))) = @em`);

  if (dup.recordset?.length) {
    const err = new Error("An account with this email already exists");
    err.status = 409;
    throw err;
  }

  const hash = await bcrypt.hash(String(password), 10);
  const prog =
    r === "STUDENT" && program_id != null && program_id !== ""
      ? Number(program_id)
      : null;

  const ins = await pool
    .request()
    .input("fn", sql.NVarChar(255), first_name.trim())
    .input("ln", sql.NVarChar(255), last_name.trim())
    .input("em", sql.NVarChar(255), emailNorm)
    .input("ph", sql.NVarChar(255), hash)
    .input("role", sql.NVarChar(50), r)
    .input("reg", sql.NVarChar(255), registration_no.trim())
    .input("pid", sql.BigInt, Number.isFinite(prog) && prog > 0 ? prog : null)
    .query(`
      INSERT INTO users (
        first_name,
        last_name,
        email,
        password_hash,
        role,
        registration_no,
        program_id,
        status,
        created_at,
        updated_at
      )
      OUTPUT INSERTED.user_id AS user_id
      VALUES (
        @fn,
        @ln,
        @em,
        @ph,
        @role,
        @reg,
        @pid,
        N'ACTIVE',
        GETDATE(),
        GETDATE()
      );
    `);

  const newId = ins.recordset?.[0]?.user_id;
  return { user_id: newId, role: r, email: emailNorm };
};
