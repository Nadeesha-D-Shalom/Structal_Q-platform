const jwt = require("jsonwebtoken");
const { verifyToken, requireRole } = require("../../src/middleware/authMiddleware");

describe("authMiddleware", () => {
  const OLD = process.env.JWT_SECRET;
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-key-for-jest";
  });
  afterAll(() => {
    process.env.JWT_SECRET = OLD;
  });

  function mockRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  }

  test("verifyToken returns 401 when no Authorization header", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();
    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("verifyToken returns 401 when Bearer missing", () => {
    const req = { headers: { authorization: "Basic x" } };
    const res = mockRes();
    const next = jest.fn();
    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("verifyToken returns 401 for invalid JWT", () => {
    const req = { headers: { authorization: "Bearer not-a-jwt" } };
    const res = mockRes();
    const next = jest.fn();
    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("verifyToken sets req.user and calls next for valid JWT", () => {
    const token = jwt.sign({ role: "student", id: 1 }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    verifyToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.role).toBe("student");
  });

  test("verifyToken uses session user when present", () => {
    const req = {
      session: { user: { role: "lecturer", id: 9 } },
      headers: {},
    };
    const res = mockRes();
    const next = jest.fn();
    verifyToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.role).toBe("lecturer");
  });

  test("requireRole allows matching role", () => {
    const mw = requireRole(["lecturer"]);
    const req = { user: { role: "lecturer" } };
    const res = mockRes();
    const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("requireRole returns 403 when role mismatch", () => {
    const mw = requireRole(["lecturer"]);
    const req = { user: { role: "student" } };
    const res = mockRes();
    const next = jest.fn();
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
