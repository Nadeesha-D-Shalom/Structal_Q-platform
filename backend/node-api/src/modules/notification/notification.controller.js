const { pool, sql } = require("../../config/db");

exports.createNotification = async (student_id, notification_type, title, message) => {
    try {
        await pool.request()
            .input("student_id",        sql.BigInt,  student_id)
            .input("notification_type", sql.VarChar,  notification_type)
            .input("title",             sql.NVarChar, title)
            .input("message",           sql.NVarChar, message)
            .query(`
                INSERT INTO student_notifications
                    (student_id, notification_type, title, message, is_read, created_at)
                VALUES
                    (@student_id, @notification_type, @title, @message, 0, SYSDATETIMEOFFSET())
            `);
    } catch (err) {
        console.error("[Notification] Failed to create notification:", err.message);
    }
}

exports.getAllNotifications = async (req, res) => {
    try {
        const { student_id } = req.params;

        const result = await pool.request()
            .input("student_id", sql.BigInt, student_id)
            .query(`
                SELECT
                    notification_id,
                    student_id,
                    notification_type,
                    title,
                    message,
                    is_read,
                    created_at
                FROM student_notifications
                WHERE student_id = @student_id
                ORDER BY created_at DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error("[Notification] GET student notifications:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};


exports.getUnreadCount = async (req, res) => {
    try {
        const { student_id } = req.params;

        const result = await pool.request()
            .input("student_id", sql.BigInt, student_id)
            .query(`
                SELECT COUNT(*) AS unread_count
                FROM student_notifications
                WHERE student_id = @student_id AND is_read = 0
            `);

        res.json({ unread_count: result.recordset[0].unread_count });
    } catch (err) {
        console.error("[Notification] GET unread count:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.UpdateStatus =  async (req, res) => {
    try {
        const { notification_id } = req.params;

        await pool.request()
            .input("notification_id", sql.BigInt, notification_id)
            .query(`
                UPDATE student_notifications
                SET is_read = 1, read_at = SYSDATETIMEOFFSET()
                WHERE notification_id = @notification_id
            `);

        res.json({ success: true, message: "Notification marked as read" });
    } catch (err) {
        console.error("[Notification] PUT mark read:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};


exports.setReadAll = async (req, res) => {
    try {
        const { student_id } = req.params;

        const result = await pool.request()
            .input("student_id", sql.BigInt, student_id)
            .query(`
                UPDATE student_notifications
                SET is_read = 1, read_at = SYSDATETIMEOFFSET()
                WHERE student_id = @student_id AND is_read = 0
            `);

        res.json({
            success: true,
            message: "All notifications marked as read",
            updated: result.rowsAffected[0]
        });
    } catch (err) {
        console.error("[Notification] PUT mark all read:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
