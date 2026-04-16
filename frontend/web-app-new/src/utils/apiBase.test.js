import { getApiBaseUrl } from "./apiBase";

describe("getApiBaseUrl", () => {
  const real = process.env;

  afterEach(() => {
    process.env = { ...real };
  });

  test("empty env returns empty string (same-origin /api)", () => {
    process.env = { ...real, REACT_APP_API_URL: "", NODE_ENV: "development" };
    expect(getApiBaseUrl()).toBe("");
  });

  test("whitespace-only env returns empty string", () => {
    process.env = { ...real, REACT_APP_API_URL: "   ", NODE_ENV: "development" };
    expect(getApiBaseUrl()).toBe("");
  });

  test("localhost URL in non-production returns empty (CRA proxy)", () => {
    process.env = {
      ...real,
      REACT_APP_API_URL: "http://localhost:5000",
      NODE_ENV: "development",
    };
    expect(getApiBaseUrl()).toBe("");
  });

  test("127.0.0.1 URL in non-production returns empty", () => {
    process.env = {
      ...real,
      REACT_APP_API_URL: "http://127.0.0.1:5000/",
      NODE_ENV: "test",
    };
    expect(getApiBaseUrl()).toBe("");
  });

  test("non-loopback URL in development is kept", () => {
    process.env = {
      ...real,
      REACT_APP_API_URL: "https://api.example.com/v1/",
      NODE_ENV: "development",
    };
    expect(getApiBaseUrl()).toBe("https://api.example.com/v1");
  });

  test("production keeps loopback URL (no proxy assumption)", () => {
    process.env = {
      ...real,
      REACT_APP_API_URL: "http://localhost:5000",
      NODE_ENV: "production",
    };
    expect(getApiBaseUrl()).toBe("http://localhost:5000");
  });
});
