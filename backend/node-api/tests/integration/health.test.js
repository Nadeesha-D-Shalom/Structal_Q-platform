const request = require("supertest");
const { app } = require("../helpers/testApp");

describe("GET /health", () => {
  it("returns backend running status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "Backend running" });
    expect(res.body).toHaveProperty("port");
  });
});

