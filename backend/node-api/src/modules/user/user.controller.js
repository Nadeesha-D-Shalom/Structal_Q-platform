const { normalizeRole } = require("../../utils/roleNormalize");
const service = require("./user.service");

function formatUserPayload(user) {
  if (!user) return null;
  const role = normalizeRole(user.role);
  return {
    user_id: user.user_id,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
    email: user.email || "",
    role,
    registration_no: user.registration_no || "",
    program_id: user.program_id ?? null,
    status: user.status || "",
    created_at: user.created_at || null,
    updated_at: user.updated_at || null,
    last_login_at: user.last_login_at || null,
  };
}

exports.getMyProfile = async (req, res) => {
  try {
    const userId = Number(req.user?.user_id);
    if (!userId) return res.status(401).json({ success: false, error: "Authentication required" });
    const user = await service.getUserById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: formatUserPayload(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to fetch profile" });
  }
};

exports.getMyModules = async (req, res) => {
  try {
    const userId = Number(req.user?.user_id);
    if (!userId) return res.status(401).json({ success: false, error: "Authentication required" });
    const role = normalizeRole(req.user?.role);
    const modules = await service.getUserModules(userId, role);
    res.json({ success: true, data: modules, role });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to fetch modules" });
  }
};

exports.changeMyPassword = async (req, res) => {
  try {
    const userId = Number(req.user?.user_id);
    if (!userId) return res.status(401).json({ success: false, error: "Authentication required" });

    const currentPassword = String(req.body?.current_password || "");
    const newPassword = String(req.body?.new_password || "");
    const confirmPassword = String(req.body?.confirm_password || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, error: "All password fields are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "New password must be at least 6 characters" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: "New password and confirmation do not match" });
    }

    await service.updatePassword(userId, currentPassword, newPassword);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    const code = /incorrect|not found/i.test(err.message || "") ? 400 : 500;
    res.status(code).json({ success: false, error: err.message || "Failed to update password" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user?.role);
    if (actorRole !== "lecturer") {
      return res.status(403).json({ success: false, error: "Only lecturers can add users" });
    }

    const first_name = String(req.body?.first_name || "").trim();
    const last_name = String(req.body?.last_name || "").trim();
    const email = String(req.body?.email || "").trim();
    const password = String(req.body?.password || "");
    const role = normalizeRole(req.body?.role);
    const registration_no = String(req.body?.registration_no || "").trim();
    const program_id_raw = req.body?.program_id;
    const program_id =
      program_id_raw === null || program_id_raw === undefined || String(program_id_raw).trim() === ""
        ? null
        : Number(program_id_raw);

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ success: false, error: "First name, last name, email and password are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: "Invalid email format" });
    }
    if (!registration_no) {
      return res.status(400).json({ success: false, error: "Registration number is required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }
    if (!["student", "lecturer"].includes(role)) {
      return res.status(400).json({ success: false, error: "Role must be student or lecturer" });
    }
    if (program_id !== null && (!Number.isInteger(program_id) || program_id <= 0)) {
      return res.status(400).json({ success: false, error: "Program ID must be a positive number" });
    }

    const userId = await service.createUser({
      first_name,
      last_name,
      email,
      password,
      role,
      registration_no,
      program_id,
    });

    res.status(201).json({ success: true, message: "User created successfully", user_id: userId });
  } catch (err) {
    const conflict = /already exists/i.test(err.message || "");
    res.status(conflict ? 409 : 500).json({ success: false, error: err.message || "Failed to create user" });
  }
};
