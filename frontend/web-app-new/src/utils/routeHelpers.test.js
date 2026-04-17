import { normalizeRouteId } from "./routeHelpers";

describe("normalizeRouteId", () => {
  test("trims string id", () => {
    expect(normalizeRouteId("  124  ")).toBe("124");
  });

  test("removes trailing slashes", () => {
    expect(normalizeRouteId("124/")).toBe("124");
    expect(normalizeRouteId("124///")).toBe("124");
  });

  test("empty param returns empty string", () => {
    expect(normalizeRouteId("")).toBe("");
    expect(normalizeRouteId(null)).toBe("");
    expect(normalizeRouteId(undefined)).toBe("");
  });

  test("coerces number to string", () => {
    expect(normalizeRouteId(42)).toBe("42");
  });
});
