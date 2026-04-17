const { getSqlConnectionHint } = require("../../src/utils/sqlConnectionHint");

describe("getSqlConnectionHint", () => {
  test("null/undefined returns generic env hint", () => {
    expect(getSqlConnectionHint(null)).toMatch(/DB_\*/);
  });

  test("detects password expired (English message)", () => {
    const err = new Error(
      "Login failed for user 'structa_user'.  Reason: The password of the account has expired."
    );
    expect(getSqlConnectionHint(err)).toMatch(/PASSWORD.*EXPIRED/i);
    expect(getSqlConnectionHint(err)).toMatch(/SSMS/);
  });

  test("detects password expired on originalError", () => {
    const err = new Error("wrapper");
    err.originalError = new Error(
      "Login failed for user 'x'. Reason: The password of the account has expired."
    );
    expect(getSqlConnectionHint(err)).toMatch(/EXPIRED/i);
  });

  test("generic login failure mentions .env", () => {
    const err = new Error("Login failed for user 'bad' in database 'db'");
    expect(getSqlConnectionHint(err)).toMatch(/DB_USER/);
  });

  test("ECONNREFUSED suggests host/firewall", () => {
    const err = new Error("connect ECONNREFUSED 127.0.0.1:1433");
    expect(getSqlConnectionHint(err)).toMatch(/Cannot reach/);
  });

  test("ENOTFOUND suggests host", () => {
    const err = new Error("getaddrinfo ENOTFOUND badhost");
    expect(getSqlConnectionHint(err)).toMatch(/Cannot reach/);
  });

  test("unknown error returns truncated string", () => {
    const err = new Error("Something obscure happened here");
    expect(getSqlConnectionHint(err)).toContain("obscure");
  });

  test("empty object falls back safely", () => {
    expect(getSqlConnectionHint({})).toBeTruthy();
  });
});
