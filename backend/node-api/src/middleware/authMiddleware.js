/**
 * Role-based access helpers using `role` request header (Admin | Student).
 * HTTP headers are lowercased in Express; we read `req.headers.role`.
 */

/** Normalizes role from headers (string, trimmed). */
function getRole(req) {
  const raw = req.headers.role ?? req.headers['role'];
  if (raw == null || String(raw).trim() === '') return null;
  return String(raw).trim();
}

/**
 * Ensures the request includes a valid role header (Admin or Student).
 * Returns 401 if missing or invalid.
 */
function requireAuthenticatedRole(req, res, next) {
  const role = getRole(req);
  if (!role || !['Admin', 'Student'].includes(role)) {
    return res.status(401).json({
      message: 'Authentication required: set header "role" to "Admin" or "Student".',
    });
  }
  req.userRole = role;
  return next();
}

/**
 * Only Admin may proceed. Use after requireAuthenticatedRole on mutating routes.
 */
function requireAdmin(req, res, next) {
  if (getRole(req) !== 'Admin') {
    return res.status(403).json({
      message: 'Forbidden: Admin access required.',
    });
  }
  return next();
}

/**
 * Student may read published timetables; Admin may read all.
 * Attaches req.userRole for controllers.
 */
function requireStudentOrAdmin(req, res, next) {
  const role = getRole(req);
  if (!role || !['Admin', 'Student'].includes(role)) {
    return res.status(401).json({
      message: 'Authentication required: set header "role" to "Admin" or "Student".',
    });
  }
  req.userRole = role;
  return next();
}

module.exports = {
  getRole,
  requireAuthenticatedRole,
  requireAdmin,
  requireStudentOrAdmin,
};
