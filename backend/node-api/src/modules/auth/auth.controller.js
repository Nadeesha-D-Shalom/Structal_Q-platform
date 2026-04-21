const service = require("./auth.service");
const jwt = require("jsonwebtoken");
const { normalizeRole } = require("../../utils/roleNormalize");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: "Email and password required"
            });
        }

        const result = await service.login(email, password);

        if (req.session) {
            req.session.user = result.user;
        }

        res.json({
            success: true,
            token: result.token,
            user: result.user
        });
    } catch (err) {
        res.status(401).json({
            success: false,
            error: err.message
        });
    }
};

exports.session = async (req, res) => {
    try {
        if (req.session && req.session.user) {
            const su = { ...req.session.user };
            if (su.role != null) su.role = normalizeRole(su.role);
            return res.json(su);
        }

        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, error: "Not authenticated" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const role = normalizeRole(decoded.role);

        const userPayload = {
            user_id: decoded.user_id,
            student_id: decoded.user_id,
            lecturer_id: decoded.user_id,
            student_name: `${decoded.first_name || ""} ${decoded.last_name || ""}`.trim(),
            student_email: decoded.email,
            academic_year: decoded.academic_year || "",
            registration_no: decoded.registration_no || "",
            role,
            email: decoded.email,
            first_name: decoded.first_name,
            last_name: decoded.last_name,
            name: `${decoded.first_name || ""} ${decoded.last_name || ""}`.trim()
        };

        return res.json(userPayload);
    } catch (err) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
    }
};

exports.logout = async (req, res) => {
    if (req.session) {
        req.session.destroy(() => {});
    }
    res.json({ success: true, message: "Logged out" });
};