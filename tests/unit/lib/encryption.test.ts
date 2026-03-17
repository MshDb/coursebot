import { describe, it, expect, vi } from "vitest";

vi.mock("@/env", () => ({
  env: {
    ENCRYPTION_KEY: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    WEBHOOK_BASE_URL: "https://example.com",
  },
}));

import { encrypt, decrypt } from "@/lib/encryption";

describe("encryption utilities", () => {
  it("should encrypt and decrypt a string successfully (roundtrip)", () => {
    const plaintext = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
    expect(encrypted).not.toBe(plaintext);
  });

  it("should produce different ciphertexts for the same plaintext (random IV)", () => {
    const plaintext = "test-bot-token-12345";
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);

    // Different IVs should produce different ciphertexts
    expect(encrypted1).not.toBe(encrypted2);

    // Both should decrypt to the same plaintext
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
  });

  it("should produce output in iv:authTag:ciphertext format", () => {
    const encrypted = encrypt("hello");
    const parts = encrypted.split(":");

    expect(parts).toHaveLength(3);
    // IV: 16 bytes = 32 hex chars
    expect(parts[0]).toHaveLength(32);
    // Auth tag: 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(32);
    // Ciphertext: non-empty hex
    expect(parts[2]!.length).toBeGreaterThan(0);
  });

  it("should throw on invalid encrypted data format", () => {
    expect(() => decrypt("invalid")).toThrow("Invalid encrypted data format");
    expect(() => decrypt("a:b")).toThrow("Invalid encrypted data format");
  });

  it("should throw on tampered ciphertext", () => {
    const encrypted = encrypt("sensitive-data");
    const parts = encrypted.split(":");
    // Tamper with ciphertext
    const tampered = `${parts[0]}:${parts[1]}:${"ff".repeat(parts[2]!.length / 2)}`;

    expect(() => decrypt(tampered)).toThrow();
  });

  it("should handle empty string encryption", () => {
    const encrypted = encrypt("");
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe("");
  });

  it("should handle unicode and special characters", () => {
    const plaintext = "токен-бота-123 🤖";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });
});
