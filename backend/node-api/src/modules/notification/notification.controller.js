const notificationService = require("./notification.service");

exports.list = async (req, res) => {
  try {
    const uid = req.user?.user_id;
    if (!uid) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const limit = req.query.limit;
    const data = await notificationService.listForUser(uid, limit);
    res.json({ success: true, data });
  } catch (err) {
    console.error("[notifications] list:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.unreadCount = async (req, res) => {
  try {
    const uid = req.user?.user_id;
    if (!uid) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const count = await notificationService.getUnreadCount(uid);
    res.json({ success: true, unread_count: count });
  } catch (err) {
    console.error("[notifications] unreadCount:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const uid = req.user?.user_id;
    if (!uid) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, error: "Invalid notification id" });
    }
    const ok = await notificationService.markRead(id, uid);
    if (!ok) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const uid = req.user?.user_id;
    if (!uid) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    await notificationService.markAllRead(uid);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
