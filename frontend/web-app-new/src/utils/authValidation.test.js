import { getDashboardPathForRole, validateLoginEmail } from "./authValidation";

describe("validateLoginEmail", () => {
  test("accepts standard email", () => {
    expect(validateLoginEmail("jane@uni.edu")).toBe(true);
  });

  test("rejects missing @", () => {
    expect(validateLoginEmail("janeuni.edu")).toBe(false);
  });

  test("rejects empty string", () => {
    expect(validateLoginEmail("")).toBe(false);
  });

  test("trims whitespace before validate", () => {
    expect(validateLoginEmail("  a@b.co  ")).toBe(true);
  });

  test("rejects spaces inside local part", () => {
    expect(validateLoginEmail("a b@c.com")).toBe(false);
  });
});

describe("getDashboardPathForRole", () => {
  test("lecturer → /lecturer", () => {
    expect(getDashboardPathForRole("lecturer")).toBe("/lecturer");
  });

  test("LECTURER case insensitive", () => {
    expect(getDashboardPathForRole("LECTURER")).toBe("/lecturer");
  });

  test("admin → /lecturer", () => {
    expect(getDashboardPathForRole("admin")).toBe("/lecturer");
  });

  test("student → /student", () => {
    expect(getDashboardPathForRole("student")).toBe("/student");
  });

  test("empty role → /student", () => {
    expect(getDashboardPathForRole("")).toBe("/student");
  });

  test("unknown role → /student", () => {
    expect(getDashboardPathForRole("guest")).toBe("/student");
  });

  test("Teacher synonym → /lecturer", () => {
    expect(getDashboardPathForRole("Teacher")).toBe("/lecturer");
  });

  test("ADMIN uppercase → /lecturer", () => {
    expect(getDashboardPathForRole("ADMIN")).toBe("/lecturer");
  });
});
