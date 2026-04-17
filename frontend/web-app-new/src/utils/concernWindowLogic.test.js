import { hoursRemainingInConcernWindow, isConcernWindowOpen } from "./concernWindowLogic";

describe("concernWindowLogic (student concern 48h rule)", () => {
  const t0 = new Date("2026-01-01T12:00:00.000Z").getTime();

  test("closed when publishedAt is null", () => {
    expect(isConcernWindowOpen(null, 0, t0)).toBe(false);
  });

  test("closed when publishedAt is empty string", () => {
    expect(isConcernWindowOpen("", 0, t0)).toBe(false);
  });

  test("closed when concern already exists", () => {
    expect(isConcernWindowOpen(new Date(t0).toISOString(), 1, t0)).toBe(false);
  });

  test("open at publish time with zero concerns", () => {
    expect(isConcernWindowOpen(new Date(t0).toISOString(), 0, t0)).toBe(true);
  });

  test("open 24h after publish", () => {
    const pub = new Date(t0).toISOString();
    expect(isConcernWindowOpen(pub, 0, t0 + 24 * 60 * 60 * 1000)).toBe(true);
  });

  test("closed 49h after publish", () => {
    const pub = new Date(t0).toISOString();
    expect(isConcernWindowOpen(pub, 0, t0 + 49 * 60 * 60 * 1000)).toBe(false);
  });

  test("still open at exactly 48h after publish (inclusive window)", () => {
    const pub = new Date(t0).toISOString();
    expect(isConcernWindowOpen(pub, 0, t0 + 48 * 60 * 60 * 1000)).toBe(true);
  });

  test("closed immediately after 48h window", () => {
    const pub = new Date(t0).toISOString();
    expect(isConcernWindowOpen(pub, 0, t0 + 48 * 60 * 60 * 1000 + 1)).toBe(false);
  });

  test("invalid date string returns closed", () => {
    expect(isConcernWindowOpen("not-a-date", 0, t0)).toBe(false);
  });

  test("concernCount string '2' treated as existing concern", () => {
    expect(isConcernWindowOpen(new Date(t0).toISOString(), "2", t0)).toBe(false);
  });

  test("hoursRemaining positive inside window", () => {
    const pub = new Date(t0).toISOString();
    const h = hoursRemainingInConcernWindow(pub, t0 + 12 * 60 * 60 * 1000);
    expect(h).toBeCloseTo(36, 5);
  });

  test("hoursRemaining zero outside window", () => {
    const pub = new Date(t0).toISOString();
    expect(hoursRemainingInConcernWindow(pub, t0 + 50 * 60 * 60 * 1000)).toBe(0);
  });

  test("hoursRemaining zero when no publishedAt", () => {
    expect(hoursRemainingInConcernWindow(null, t0)).toBe(0);
  });

  test("accepts Date object as publishedAt", () => {
    expect(isConcernWindowOpen(new Date(t0), 0, t0)).toBe(true);
  });

  test("concernCount 0 from string", () => {
    expect(isConcernWindowOpen(new Date(t0).toISOString(), "0", t0)).toBe(true);
  });
});
