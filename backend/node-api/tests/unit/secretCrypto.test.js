const {
  encryptSecret,
  decryptSecret,
  resolveDbPassword
} = require("../../src/utils/secretCrypto");

describe("secretCrypto", () => {
  const key = "unit-test-key-123";

  test("encrypt + decrypt round trip", () => {
    const encrypted = encryptSecret("P@ssw0rd!", key);
    const decrypted = decryptSecret(encrypted, key);
    expect(decrypted).toBe("P@ssw0rd!");
  });

  test("resolveDbPassword returns plain DB_PASSWORD when present", () => {
    const password = resolveDbPassword({
      DB_PASSWORD: "plain-password",
      DB_PASSWORD_ENC: "ignored",
      DB_PASSWORD_KEY: key
    });
    expect(password).toBe("plain-password");
  });

  test("resolveDbPassword decrypts DB_PASSWORD_ENC when plain is absent", () => {
    const encrypted = encryptSecret("encrypted-pass", key);
    const password = resolveDbPassword({
      DB_PASSWORD_ENC: encrypted,
      DB_PASSWORD_KEY: key
    });
    expect(password).toBe("encrypted-pass");
  });

  test("resolveDbPassword returns undefined when no password config", () => {
    expect(resolveDbPassword({})).toBeUndefined();
  });

  test("decryptSecret fails with wrong key", () => {
    const encrypted = encryptSecret("top-secret", key);
    expect(() => decryptSecret(encrypted, "wrong-key")).toThrow();
  });
});
