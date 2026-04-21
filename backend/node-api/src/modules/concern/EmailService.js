const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

function buildEmailTemplate({
    student_name,
    concern_id,
    assignment,
    subject_name,
    subject_code,
    priority_level,
    original_mark,
    revised_mark,
    concern_status,
    lecturer_comment,
    lecturer_name
}) {
  // Status color mapping
    const statusColors = {
        Accepted: { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
        Rejected: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
        Revised:  { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
        Pending:  { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" }
    };

    const priorityColors = {
        High:   { bg: "#fee2e2", text: "#dc2626" },
        Medium: { bg: "#fef3c7", text: "#d97706" },
        Low:    { bg: "#d1fae5", text: "#059669" }
    };

    const sc = statusColors[concern_status]  || statusColors.Pending;
    const pc = priorityColors[priority_level] || { bg: "#f3f4f6", text: "#6b7280" };

    const markChangeRow = revised_mark != null
        ? `
        <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;width:40%">Revised Mark</td>
            <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:13px;font-weight:700">
            <span style="color:#10b981">${revised_mark}/100</span>
            <span style="color:#94a3b8;font-weight:400;font-size:12px;margin-left:6px">
                (was ${original_mark}/100)
            </span>
            </td>
        </tr>`
        : `
        <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;width:40%">Original Mark</td>
            <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:13px;font-weight:600">${original_mark}/100</td>
        </tr>`;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Concern Response</title>
    </head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif">

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0">
        <tr>
        <td align="center">
            <table width="600" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:16px;overflow:hidden;
                        box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%">

            <!-- ── Header ── -->
            <tr>
                <td style="background:linear-gradient(135deg,#1e3a8a 0%,#3c74ff 100%);
                            padding:36px 40px;text-align:center">
                <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px auto;">
                    <tr>
                        <td style="width:56px;height:56px;background:rgba(255,255,255,0.15);
                                    border-radius:14px;text-align:center;vertical-align:middle;
                                    font-size:28px;line-height:56px;">
                            📋
                        </td>
                    </tr>
                </table>
                <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 6px 0;
                            letter-spacing:-0.3px">
                    Concern Response
                </h1>
                <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:0">
                    Marks Review &amp; Resolution Portal
                </p>
                </td>
            </tr>

            <!-- ── Greeting ── -->
            <tr>
                <td style="padding:32px 40px 0 40px">
                <p style="font-size:15px;color:#1e293b;margin:0 0 8px 0;font-weight:600">
                    Dear ${student_name},
                </p>
                <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px 0">
                    Your concern regarding <strong>${assignment}</strong> has been reviewed by your lecturer.
                    Please find the details and response below.
                </p>
                </td>
            </tr>

            <!-- ── Status badge ── -->
            <tr>
                <td style="padding:0 40px 24px 40px">
                <div style="background:${sc.bg};border:1px solid ${sc.border};
                            border-radius:12px;padding:16px 20px;text-align:center">
                    <p style="margin:0;font-size:12px;color:${sc.text};
                            text-transform:uppercase;letter-spacing:0.8px;font-weight:600;
                            margin-bottom:4px">
                    Concern Status
                    </p>
                    <p style="margin:0;font-size:24px;font-weight:800;color:${sc.text}">
                    ${concern_status}
                    </p>
                </div>
                </td>
            </tr>

            <!-- ── Concern details table ── -->
            <tr>
                <td style="padding:0 40px 24px 40px">
                <p style="font-size:12px;font-weight:700;color:#94a3b8;
                            text-transform:uppercase;letter-spacing:0.6px;margin:0 0 12px 0">
                    Concern Details
                </p>
                <table width="100%" cellpadding="0" cellspacing="0"
                        style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
                    <tr style="background:#f8fafc">
                    <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;
                                color:#64748b;font-size:13px;width:40%">Concern ID</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;
                                color:#0f172a;font-size:13px;font-weight:600;
                                font-family:monospace;color:#3c74ff">${concern_id}</td>
                    </tr>
                    <tr>
                    <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;
                                color:#64748b;font-size:13px">Assignment</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;
                                color:#0f172a;font-size:13px;font-weight:600">${assignment}</td>
                    </tr>
                    <tr style="background:#f8fafc">
                    <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;
                                color:#64748b;font-size:13px">Subject</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;
                                color:#0f172a;font-size:13px;font-weight:600">
                        ${subject_name}
                        ${subject_code ? `<span style="color:#94a3b8;font-weight:400;font-size:11px;margin-left:6px">(${subject_code})</span>` : ""}
                    </td>
                    </tr>
                    
                    ${markChangeRow}
                    <tr style="background:#f8fafc">
                    <td style="padding:10px 16px;color:#64748b;font-size:13px">Reviewed by</td>
                    <td style="padding:10px 16px;color:#0f172a;font-size:13px;font-weight:600">
                        ${lecturer_name}
                    </td>
                    </tr>
                </table>
                </td>
            </tr>

            <!-- ── Lecturer comment ── -->
            <tr>
                <td style="padding:0 40px 32px 40px">
                <p style="font-size:12px;font-weight:700;color:#94a3b8;
                            text-transform:uppercase;letter-spacing:0.6px;margin:0 0 12px 0">
                    Lecturer's Response
                </p>
                <div style="background:#f8fafc;border-left:4px solid #3c74ff;
                            border-radius:0 10px 10px 0;padding:20px 20px 20px 24px">
                    <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.7;
                            font-style:italic">
                    "${lecturer_comment}"
                    </p>
                    <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8">
                    — ${lecturer_name}
                    </p>
                </div>
                </td>
            </tr>

            <!-- ── Divider ── -->
            <tr>
                <td style="padding:0 40px">
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:0"/>
                </td>
            </tr>

            <!-- ── Footer note ── -->
            <tr>
                <td style="padding:24px 40px 32px 40px;text-align:center">
                <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6">
                    This is an automated notification from the StructalQ Platform.<br/>
                    If you have further queries, please contact your lecturer or department.
                </p>
                </td>
            </tr>

            <!-- ── Footer bar ── -->
            <tr>
                <td style="background:#1e293b;padding:16px 40px;text-align:center">
                <p style="margin:0;font-size:11px;color:#475569">
                    © ${new Date().getFullYear()} StructalQ Platform · All rights reserved
                </p>
                </td>
            </tr>

            </table>
        </td>
        </tr>
    </table>

    </body>
    </html>
    `.trim();
    }

async function EmailSender(req, res) {
    const {
        to,
        student_name,
        concern_id,
        assignment,
        subject_name,
        subject_code,
        priority_level,
        original_mark,
        revised_mark,
        concern_status,
        lecturer_comment,
        lecturer_name
    } = req.body;

  // Basic validation 
    if (!to || !student_name || !concern_id || !lecturer_comment) {
        return res.status(400).json({
        success: false,
        error: "Missing required fields: to, student_name, concern_id, lecturer_comment"
        });
    }

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
        return res.status(400).json({ success: false, error: "Invalid email address" });
    }

    // Mail options
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER;
    const fromName    = process.env.EMAIL_FROM_NAME    || "StructalQ Platform";

    const statusLabels = {
        Accepted: "✅ Accepted",
        Rejected: "❌ Rejected",
        Revised:  "🔄 Revised",
        Pending:  "⏳ Pending"
    };

    const mailOptions = {
        from:    `"${fromName}" <${fromAddress}>`,
        to,
        subject: `[Concern ${concern_id}] Response: ${statusLabels[concern_status] || concern_status} — ${assignment}`,
        html:    buildEmailTemplate({
        student_name,
        concern_id,
        assignment,
        subject_name:    subject_name  || "N/A",
        subject_code:    subject_code  || "",
        priority_level:  priority_level || "N/A",
        original_mark:   original_mark != null ? original_mark : "N/A",
        revised_mark:    revised_mark != null   ? revised_mark  : null,
        concern_status:  concern_status || "Pending",
        lecturer_comment,
        lecturer_name:   lecturer_name || "Your Lecturer"
        }),

        // Plain-text fallback
        text: [
        `Dear ${student_name},`,
        "",
        `Your concern (ID: ${concern_id}) for "${assignment}" has been reviewed.`,
        "",
        `Status: ${concern_status}`,
        revised_mark != null
            ? `Mark updated: ${original_mark}/100 → ${revised_mark}/100`
            : `Mark: ${original_mark}/100`,
        "",
        `Lecturer's Response:`,
        `"${lecturer_comment}"`,
        "",
        `— ${lecturer_name}`,
        "",
        "This is an automated notification from the StructalQ Platform."
        ].join("\n")
    };

    // Send the email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] Concern response sent to ${to} | messageId: ${info.messageId}`);
        return res.status(200).json({
        success: true,
        message: `Email successfully sent to ${to}`,
        messageId: info.messageId
        });
    } catch (err) {
        console.error("[Email] Failed to send concern response email:", err.message);
        return res.status(500).json({
        success: false,
        error: "Failed to send email",
        details: err.message
        });
    }
}

module.exports = EmailSender;