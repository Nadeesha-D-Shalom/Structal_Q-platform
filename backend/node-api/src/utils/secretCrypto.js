const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function buildKey(keyMaterial) {
  if (!keyMaterial) {
    throw new Error("DB password key is missing. Set DB_PASSWORD_KEY.");
  }

  return crypto.createHash("sha256").update(keyMaterial, "utf8").digest();
}

function encryptSecret(plainText, keyMaterial) {
  if (typeof plainText !== "string" || plainText.length === 0) {
    throw new Error("Secret to encrypt must be a non-empty string.");
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = buildKey(keyMaterial);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decryptSecret(encryptedValue, keyMaterial) {
  if (typeof encryptedValue !== "string" || encryptedValue.length === 0) {
    throw new Error("Encrypted secret must be a non-empty string.");
  }

  const parts = encryptedValue.split(":");
  if (parts.length !== 3) {
    throw new Error(
      "Encrypted secret format is invalid. Expected iv:authTag:cipherText (base64)."
    );
  }

  const [ivBase64, authTagBase64, cipherTextBase64] = parts;
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const cipherText = Buffer.from(cipherTextBase64, "base64");

  const key = buildKey(keyMaterial);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(cipherText),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}

function resolveDbPassword(env = process.env) {
  if (env.DB_PASSWORD) return env.DB_PASSWORD;

  if (!env.DB_PASSWORD_ENC) {
    return undefined;
  }

  return decryptSecret(env.DB_PASSWORD_ENC, env.DB_PASSWORD_KEY);
}

if (require.main === module) {
  const plainText = process.argv[2];
  const keyMaterial = process.env.DB_PASSWORD_KEY || process.argv[3];

  if (!plainText) {
    console.error(
      "Usage: node src/utils/secretCrypto.js \"plain_db_password\" [key]"
    );
    process.exit(1);
  }

  try {
    const encryptedValue = encryptSecret(plainText, keyMaterial);
    console.log("DB_PASSWORD_ENC=" + encryptedValue);
  } catch (error) {
    console.error("Failed to encrypt DB password:", error.message);
    process.exit(1);
  }
}

module.exports = {
  encryptSecret,
  decryptSecret,
  resolveDbPassword
};
