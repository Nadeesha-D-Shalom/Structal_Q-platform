const bcrypt = require("bcrypt");
const { pool, sql } = require("../../config/db");
const { normalizeRole } = require("../../utils/roleNormalize");

function toDbRole(role) {
  const normalized = normalizeRole(role);
  if (normalized === "lecturer") return "LECTURER";
  if (normalized === "student") return "STUDENT";
  if (normalized === "admin") return "ADMIN";
  return "";
}

async function getUserById(userId) {
  const result = await pool
    .request()
    .input("user_id", sql.BigInt, userId)
    .query(`
      SELECT
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.registration_no,
        u.program_id,
        u.status,
        u.created_at,
        u.updated_at,
        u.last_login_at
      FROM users u
      WHERE u.user_id = @user_id;
    `);
  return result.recordset?.[0] || null;
}

async function getStudentModules(userId) {
  const result = await pool
    .request()
    .input("user_id", sql.BigInt, userId)
    .query(`
      SELECT DISTINCT
        s.subject_id,
        s.subject_code,
        s.subject_name,
        so.academic_year,
        so.semester
      FROM submission sb
      INNER JOIN assessment a ON a.assessment_id = sb.assessment_id
      INNER JOIN subject_offering so ON so.offering_id = a.offering_id
      INNER JOIN subject s ON s.subject_id = so.subject_id
      WHERE sb.student_id = @user_id
      ORDER BY s.subject_code ASC, so.academic_year DESC, so.semester DESC;
    `);
  return result.recordset || [];
}

async function getLecturerModules(userId) {
  const result = await pool
    .request()
    .input("user_id", sql.BigInt, userId)
    .query(`
      SELECT DISTINCT
        s.subject_id,
        s.subject_code,
        s.subject_name,
        so.academic_year,
        so.semester
      FROM assessment a
      INNER JOIN subject_offering so ON so.offering_id = a.offering_id
      INNER JOIN subject s ON s.subject_id = so.subject_id
      WHERE a.created_by = @user_id
      ORDER BY s.subject_code ASC, so.academic_year DESC, so.semester DESC;
    `);
  return result.recordset || [];
}

async function getUserModules(userId, role) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "lecturer") return getLecturerModules(userId);
  return getStudentModules(userId);
}

async function updatePassword(userId, currentPassword, newPassword) {
  const result = await pool
    .request()
    .input("user_id", sql.BigInt, userId)
    .query(`
      SELECT user_id, password_hash
      FROM users
      WHERE user_id = @user_id;
    `);

  const user = result.recordset?.[0];
  if (!user) {
    throw new Error("User not found");
  }

  const stored = String(user.password_hash || "");
  let matches = false;
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    matches = await bcrypt.compare(currentPassword, stored);
  } else {
    matches = currentPassword === stored;
  }

  if (!matches) {
    throw new Error("Current password is incorrect");
  }

  const nextHash = await bcrypt.hash(newPassword, 10);
  await pool
    .request()
    .input("user_id", sql.BigInt, userId)
    .input("password_hash", sql.NVarChar(255), nextHash)
    .query(`
      UPDATE users
      SET password_hash = @password_hash,
          updated_at = GETDATE()
      WHERE user_id = @user_id;
    `);
}

async function createUser({ first_name, last_name, email, password, role, registration_no, program_id }) {
  const dbRole = toDbRole(role);
  if (!dbRole || (dbRole !== "STUDENT" && dbRole !== "LECTURER")) {
    throw new Error("Role must be STUDENT or LECTURER");
  }

  const existing = await pool
    .request()
    .input("email", sql.NVarChar(255), String(email).trim())
    .query(`
      SELECT TOP 1 user_id
      FROM users
      WHERE LOWER(email) = LOWER(@email);
    `);

  if (existing.recordset?.length) {
    throw new Error("A user with this email already exists");
  }

  const hash = await bcrypt.hash(password, 10);
  const request = pool
    .request()
    .input("first_name", sql.NVarChar(255), String(first_name).trim())
    .input("last_name", sql.NVarChar(255), String(last_name).trim())
    .input("email", sql.NVarChar(255), String(email).trim())
    .input("password_hash", sql.NVarChar(255), hash)
    .input("role", sql.NVarChar(50), dbRole)
    .input("registration_no", sql.NVarChar(255), registration_no ? String(registration_no).trim() : null)
    .input("program_id", sql.BigInt, program_id || null);

  const result = await request.query(`
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
      @first_name,
      @last_name,
      @email,
      @password_hash,
      @role,
      @registration_no,
      @program_id,
      'ACTIVE',
      GETDATE(),
      GETDATE()
    );
  `);

  return result.recordset?.[0]?.user_id;
}

module.exports = {
  getUserById,
  getUserModules,
  updatePassword,
  createUser,
};
