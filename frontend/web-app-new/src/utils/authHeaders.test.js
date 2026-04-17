import { buildAuthHeaders } from "./authHeaders";

describe("buildAuthHeaders", () => {
  test("empty token returns empty object", () => {
    expect(buildAuthHeaders("")).toEqual({});
    expect(buildAuthHeaders(null)).toEqual({});
    expect(buildAuthHeaders(undefined)).toEqual({});
  });

  test("whitespace-only token returns empty object", () => {
    expect(buildAuthHeaders("   ")).toEqual({});
  });

  test("sets Bearer scheme", () => {
    expect(buildAuthHeaders("abc123")).toEqual({ Authorization: "Bearer abc123" });
  });

  test("trims token", () => {
    expect(buildAuthHeaders("  tok  ")).toEqual({ Authorization: "Bearer tok" });
  });
});
