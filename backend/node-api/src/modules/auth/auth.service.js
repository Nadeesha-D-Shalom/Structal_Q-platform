const { pool, sql } = require("../../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { normalizeRole } = require("../../utils/roleNormalize");

async function comparePassword(password, storedHash) {
    if (!storedHash) return false;
    if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
        return bcrypt.compare(password, storedHash);
    }
    return password === storedHash;
}

exports.login = async (email, password) => {
    const result = await pool.request()
        .input("email", sql.VarChar, email)
        .query(`
        SELECT * FROM users WHERE email = @email AND status = 'ACTIVE'
        `);

    const user = result.recordset[0];

    if (!user) throw new Error("User not found");

    const isMatch = await comparePassword(password, user.password_hash);

    if (!isMatch) throw new Error("Invalid password");

    const role = normalizeRole(user.role);

    const token = jwt.sign(
        {
            user_id: user.user_id,
            role,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            academic_year: user.academic_year || "",
            registration_no: user.registration_no || ""
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || "8h" }
    );

    return {
        token,
        user: {
            user_id: user.user_id,
            student_id: user.user_id,
            lecturer_id: user.user_id,
            student_name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
            student_email: user.email,
            academic_year: user.academic_year || "",
            name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
            role,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            registration_no: user.registration_no,
            program_id: user.program_id
        }
    };
};