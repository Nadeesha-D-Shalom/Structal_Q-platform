const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send email function
exports.sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: `"StructaIQ" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text
        });

        return { success: true };

    } catch (err) {
        console.error("Email error:", err);
        return { success: false, error: err.message };
    }
};