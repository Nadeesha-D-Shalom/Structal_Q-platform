'use strict';

require('dotenv').config();

const nodemailer = require('nodemailer');

let transporter;

const APP_URL = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'StructalQ Platform';
const CONTACT_NAME =
    process.env.EMAIL_CONTACT_NAME ||
    process.env.LECTURER_CONTACT_NAME ||
    process.env.ADMIN_CONTACT_NAME ||
    '';
const CONTACT_EMAIL =
    process.env.EMAIL_CONTACT_ADDRESS ||
    process.env.LECTURER_CONTACT_EMAIL ||
    process.env.ADMIN_CONTACT_EMAIL ||
    '';
const FROM_ADDRESS =
    process.env.EMAIL_FROM_ADDRESS ||
    process.env.SMTP_USER ||
    process.env.GMAIL_USER ||
    'no-reply@structalq.edu';
const FROM = `"${FROM_NAME}" <${FROM_ADDRESS}>`;

async function getTransporter() {
    if (transporter) {
        return transporter;
    }

    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpService = process.env.SMTP_SERVICE;
    const useGmail =
        smtpService === 'gmail' ||
        (!smtpHost && typeof smtpUser === 'string' && smtpUser.toLowerCase().includes('@gmail.com'));

    if (smtpUser && smtpPass && (smtpHost || useGmail)) {
        transporter = nodemailer.createTransport({
            ...(useGmail
                ? { service: 'gmail' }
                : {
                    host: smtpHost,
                    port: smtpPort,
                    secure: process.env.SMTP_SECURE === 'true',
                    tls: {
                        rejectUnauthorized: process.env.SMTP_TLS_REJECT !== 'false',
                    },
                }),
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        await transporter.verify();
        console.log(`[emailService] Using SMTP: ${useGmail ? 'gmail' : `${smtpHost}:${smtpPort}`}`);
        return transporter;
    }

    throw new Error(
        'SMTP credentials are not configured. Set SMTP_USER/SMTP_PASS for Gmail SMTP or provide SMTP_HOST/SMTP_PORT settings.'
    );
}

function formatDate(value) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function formatLocation(locationName, roomNumber) {
    return `${locationName || '-'}${roomNumber ? ` &middot; ${roomNumber}` : ''}`;
}

function formatAssignedTime(slotStartTime, slotEndTime) {
    if (!slotStartTime && !slotEndTime) {
        return null;
    }

    return `${slotStartTime || '-'} - ${slotEndTime || '-'}`;
}

function buildHtml(title, body, ctaLabel, ctaUrl) {
    const ctaBlock = ctaLabel && ctaUrl
        ? `<tr><td align="center" style="padding:24px 0 8px;">
             <a href="${ctaUrl}"
                style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;
                       font-family:'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:600;
                       border-radius:8px;text-decoration:none;">
                ${ctaLabel}
             </a>
           </td></tr>`
        : '';
    const contactLine = CONTACT_EMAIL
        ? `Contact: ${CONTACT_NAME || 'Lecturer/Admin'} (${CONTACT_EMAIL})<br>`
        : '';

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;overflow:hidden;
                    box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a2b4a;padding:24px 32px;text-align:left;">
            <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
              Structal<span style="color:#f97316;">Q</span>
            </span>
            <span style="display:block;font-size:11px;color:rgba(255,255,255,0.55);
                         margin-top:4px;text-transform:uppercase;letter-spacing:1px;">
              Academic Evaluation Platform
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 8px;">
            <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">
              ${title}
            </h2>
            <div style="font-size:14px;color:#374151;line-height:1.7;">
              ${body}
            </div>
          </td>
        </tr>
        ${ctaBlock}
        <tr>
          <td style="padding:24px 32px;border-top:1px solid #e5e7eb;margin-top:24px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
              This is an automated notification from the StructalQ Platform.<br>
              ${contactLine}
              Please do not reply to this email. Contact your lecturer for any queries.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to, subject, textBody, htmlBody) {
    const emailTransporter = await getTransporter();
    let lastError;

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const info = await emailTransporter.sendMail({
                from: FROM,
                to,
                subject,
                text: textBody,
                html: htmlBody || `<p style="font-family:Arial,sans-serif;font-size:14px;color:#374151;">${textBody}</p>`,
            });

            return { info, retryCount: attempt };
        } catch (err) {
            lastError = err;
        }
    }

    lastError.retryCount = 1;
    throw lastError;
}

async function sendSchedulePublishedEmail(recipientEmail, recipientName, scheduleInfo) {
    const {
        schedule_title,
        date,
        start_time,
        end_time,
        location_name,
        room_number,
        slot_start_time,
        slot_end_time,
        group_label,
    } = scheduleInfo;
    const assignedTime = formatAssignedTime(slot_start_time, slot_end_time);

    const subject = `Evaluation Schedule Published - ${schedule_title}`;
    const body = `
        <p>Dear ${recipientName || 'Student'},</p>
        <p>Your evaluation schedule is now confirmed. Please use the assigned slot details below.</p>
        <table width="100%" cellpadding="8" cellspacing="0"
               style="border:1px solid #e5e7eb;border-radius:8px;font-size:13px;margin:16px 0;">
          <tr style="background:#f9fafb;">
            <td style="font-weight:600;color:#6b7280;width:40%;">Schedule</td>
            <td style="color:#111827;">${schedule_title}</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#6b7280;">Date</td>
            <td style="color:#111827;">${formatDate(date)}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="font-weight:600;color:#6b7280;">Time Window</td>
            <td style="color:#111827;">${start_time || '-'} - ${end_time || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#6b7280;">Assigned Slot</td>
            <td style="color:#111827;font-weight:700;">${assignedTime || 'Assigned after group allocation'}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="font-weight:600;color:#6b7280;">Group</td>
            <td style="color:#111827;">${group_label || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#6b7280;">Location</td>
            <td style="color:#111827;">${formatLocation(location_name, room_number)}</td>
          </tr>
        </table>
        <p>Please share this confirmed slot with your group members and arrive 5 minutes early.</p>
    `;

    return sendEmail(
        recipientEmail,
        subject,
        `Evaluation schedule published: ${schedule_title}`,
        buildHtml('Evaluation Schedule Published', body, 'View My Schedule', APP_URL)
    );
}

async function sendSlotAssignedEmail(recipientEmail, recipientName, slotInfo) {
    const {
        schedule_title,
        date,
        slot_start_time,
        slot_end_time,
        location_name,
        room_number,
        slot_sequence_no,
        group_label,
    } = slotInfo;

    const subject = `Your Evaluation Slot Has Been Assigned - ${schedule_title}`;
    const body = `
        <p>Dear ${recipientName || 'Student'},</p>
        <p>Your group has been assigned an evaluation slot. Please arrive on time and be fully prepared.</p>
        <table width="100%" cellpadding="8" cellspacing="0"
               style="border:1px solid #e5e7eb;border-radius:8px;font-size:13px;margin:16px 0;">
          <tr style="background:#eff6ff;">
            <td colspan="2" style="font-weight:700;color:#1d4ed8;font-size:14px;">Your Slot Details</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#6b7280;width:40%;">Schedule</td>
            <td style="color:#111827;">${schedule_title}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="font-weight:600;color:#6b7280;">Date</td>
            <td style="color:#111827;">${formatDate(date)}</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#6b7280;">Time</td>
            <td style="color:#111827;font-weight:700;">${slot_start_time || '-'} - ${slot_end_time || '-'}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="font-weight:600;color:#6b7280;">Location</td>
            <td style="color:#111827;">${formatLocation(location_name, room_number)}</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#6b7280;">Slot #</td>
            <td style="color:#111827;">${slot_sequence_no || '-'}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="font-weight:600;color:#6b7280;">Group</td>
            <td style="color:#111827;">${group_label || '-'}</td>
          </tr>
        </table>
        <p style="color:#d97706;font-size:13px;">Please arrive 5 minutes before your slot time.</p>
    `;

    return sendEmail(
        recipientEmail,
        subject,
        `Slot assigned: ${slot_start_time || '-'} - ${slot_end_time || '-'}`,
        buildHtml('Your Evaluation Slot Has Been Assigned', body, 'View Full Schedule', APP_URL)
    );
}

async function sendReminderEmail(recipientEmail, recipientName, slotInfo) {
    const { schedule_title, date, slot_start_time, slot_end_time, location_name, room_number } = slotInfo;

    const subject = `Reminder: Evaluation Tomorrow - ${schedule_title}`;
    const body = `
        <p>Dear ${recipientName || 'Student'},</p>
        <p>This is a reminder that your evaluation is scheduled for <strong>tomorrow</strong>.</p>
        <table width="100%" cellpadding="8" cellspacing="0"
               style="border:1px solid #fde68a;border-radius:8px;background:#fffbeb;font-size:13px;margin:16px 0;">
          <tr>
            <td style="font-weight:600;color:#92400e;width:40%;">Date</td>
            <td style="color:#111827;">${formatDate(date)}</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#92400e;">Time</td>
            <td style="color:#111827;font-weight:700;">${slot_start_time || '-'} - ${slot_end_time || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#92400e;">Location</td>
            <td style="color:#111827;">${formatLocation(location_name, room_number)}</td>
          </tr>
        </table>
        <p>Please ensure your submission is complete and your group is ready. Good luck.</p>
    `;

    return sendEmail(
        recipientEmail,
        subject,
        `Reminder: Evaluation tomorrow at ${slot_start_time || '-'}`,
        buildHtml('Evaluation Reminder', body)
    );
}

async function sendScheduleUpdatedEmail(recipientEmail, recipientName, scheduleInfo) {
    const {
        schedule_title,
        date,
        start_time,
        end_time,
        location_name,
        room_number,
        slot_start_time,
        slot_end_time,
        group_label,
    } = scheduleInfo;
    const assignedTime = formatAssignedTime(slot_start_time, slot_end_time);

    const subject = `Evaluation Schedule Updated - ${schedule_title}`;
    const body = `
        <p>Dear ${recipientName || 'Student'},</p>
        <p>Your evaluation schedule has been updated. Please review the latest assigned slot details below.</p>
        <table width="100%" cellpadding="8" cellspacing="0"
               style="border:1px solid #e5e7eb;border-radius:8px;font-size:13px;margin:16px 0;">
          <tr style="background:#f9fafb;">
            <td style="font-weight:600;color:#6b7280;width:40%;">Schedule</td>
            <td style="color:#111827;">${schedule_title}</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#6b7280;">Date</td>
            <td style="color:#111827;">${formatDate(date)}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="font-weight:600;color:#6b7280;">Time Window</td>
            <td style="color:#111827;">${start_time || '-'} - ${end_time || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#6b7280;">Assigned Slot</td>
            <td style="color:#111827;font-weight:700;">${assignedTime || 'Assigned after group allocation'}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="font-weight:600;color:#6b7280;">Group</td>
            <td style="color:#111827;">${group_label || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#6b7280;">Location</td>
            <td style="color:#111827;">${formatLocation(location_name, room_number)}</td>
          </tr>
        </table>
        <p>Please use this updated slot going forward and inform your group members if needed.</p>
    `;

    return sendEmail(
        recipientEmail,
        subject,
        `Evaluation schedule updated: ${schedule_title}`,
        buildHtml('Evaluation Schedule Updated', body, 'View Updated Schedule', APP_URL)
    );
}

async function sendRescheduleNotificationEmail(recipientEmail, recipientName, scheduleInfo) {
    const {
        schedule_title,
        date,
        start_time,
        end_time,
        location_name,
        room_number,
        slot_start_time,
        slot_end_time,
        group_label,
    } = scheduleInfo;
    const assignedTime = formatAssignedTime(slot_start_time, slot_end_time);

    const subject = `Evaluation Rescheduled - ${schedule_title}`;
    const body = `
        <p>Dear ${recipientName || 'Student'},</p>
        <p>Your evaluation has been rescheduled. Please note the new confirmed slot below.</p>
        <table width="100%" cellpadding="8" cellspacing="0"
               style="border:1px solid #fde68a;border-radius:8px;background:#fffbeb;font-size:13px;margin:16px 0;">
          <tr>
            <td style="font-weight:600;color:#92400e;width:40%;">Schedule</td>
            <td style="color:#111827;">${schedule_title}</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#92400e;">Date</td>
            <td style="color:#111827;">${formatDate(date)}</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#92400e;">Time Window</td>
            <td style="color:#111827;font-weight:700;">${start_time || '-'} - ${end_time || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#92400e;">Assigned Slot</td>
            <td style="color:#111827;font-weight:700;">${assignedTime || 'Assigned after group allocation'}</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#92400e;">Group</td>
            <td style="color:#111827;">${group_label || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight:600;color:#92400e;">Location</td>
            <td style="color:#111827;">${formatLocation(location_name, room_number)}</td>
          </tr>
        </table>
        <p>Please follow this new slot time and inform your group members about the change.</p>
    `;

    return sendEmail(
        recipientEmail,
        subject,
        `Evaluation rescheduled: ${schedule_title}`,
        buildHtml('Evaluation Rescheduled', body, 'Review New Schedule', APP_URL)
    );
}

module.exports = {
    sendEmail,
    sendSchedulePublishedEmail,
    sendSlotAssignedEmail,
    sendReminderEmail,
    sendScheduleUpdatedEmail,
    sendRescheduleNotificationEmail,
};
