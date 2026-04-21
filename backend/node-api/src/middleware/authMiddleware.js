const jwt = require("jsonwebtoken");
const { normalizeRole } = require("../utils/roleNormalize");

exports.verifyToken = (req, res, next) => {
    if (req.session && req.session.user) {
        req.user = { ...req.session.user };
        if (req.user.role != null && req.user.role !== "") {
            req.user.role = normalizeRole(req.user.role);
        }
        return next();
    }

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            ...decoded,
            role: normalizeRole(decoded.role),
        };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

exports.requireRole = (roles) => {
    return (req, res, next) => {
        const roleList = (Array.isArray(roles) ? roles : [roles]).map((r) =>
            normalizeRole(r)
        );
        const userRole = normalizeRole(req.user?.role);
        if (!req.user || !roleList.includes(userRole)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    };
};