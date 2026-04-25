const service = require("./profile.service");
const { normalizeRole } = require("../../utils/roleNormalize");

exports.getMe = async (req, res) => {
  try {
    const userId =
      req.user?.user_id ?? req.user?.student_id ?? req.user?.lecturer_id ?? req.user?.id;
    if (userId == null || userId === "") {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const data = await service.getProfileWithModules(userId);
    if (!data) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    const roleNorm = normalizeRole(data.user.role);
    res.json({
      success: true,
      user: {
        ...data.user,
        role_normalized: roleNorm,
      },
      modules: data.modules,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId =
      req.user?.user_id ?? req.user?.student_id ?? req.user?.lecturer_id ?? req.user?.id;
    if (userId == null || userId === "") {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        error: "current_password and new_password are required",
      });
    }
    if (String(new_password).length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters",
      });
    }
    await service.changePassword(userId, current_password, new_password);
    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const created = await service.createUserByLecturer(req.body || {});
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, error: err.message });
  }
};
