const { pool, sql } = require("../../config/db");
const jwt = require("jsonwebtoken");

exports.login = async (email, password) => {
    const result = await pool.request()
        .input("email", sql.VarChar, email)
        .query(`
            SELECT * FROM users WHERE email = @email AND status = 'ACTIVE'
        `);

    const user = result.recordset[0];

    if (!user) throw new Error("User not found");

    const isMatch = password === user.password_hash;

    if (!isMatch) throw new Error("Invalid password");

    const token = jwt.sign(
        {
            user_id: user.user_id,
            role: user.role,
            email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );

    return {
        token,
        user: {
            id: user.user_id,
            name: user.first_name + " " + user.last_name,
            role: user.role,
            email: user.email
        }
    };
};