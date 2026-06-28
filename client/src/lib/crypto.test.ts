import { describe, it, expect } from "vitest";
import {
  generateE2EKeys,
  decryptE2EKey,
  encryptMessage,
  decryptMessage,
} from "./crypto";

if (typeof window === "undefined") {
  const globalObject = globalThis as unknown as Record<string, unknown>;
  globalObject.window = globalThis;
}

describe("End-to-End Cryptographic Engine Pipelines", () => {
  const mockPassword = "SuperSecurePassword123!";
  const cleartextMessage = "This is a zero-knowledge confidential message.";

  let senderKeys: Awaited<ReturnType<typeof generateE2EKeys>>;
  let recipientKeys: Awaited<ReturnType<typeof generateE2EKeys>>;
  let encryptedMsgPayload: Awaited<ReturnType<typeof encryptMessage>>;

  // Generate E2E keys
  it("should successfully generate and serialize valid symmetric key packages", async () => {
    senderKeys = await generateE2EKeys(mockPassword);
    recipientKeys = await generateE2EKeys("RecipientPassword987!");

    expect(senderKeys).toHaveProperty("publicKey");
    expect(senderKeys).toHaveProperty("privateKey");
    expect(senderKeys).toHaveProperty("encryptedPrivateKey");

    expect(senderKeys.publicKey).toContain("RSA-OAEP");

    // Tests to see if the encrypted text structure is correct
    expect(senderKeys.encryptedPrivateKey).toContain(".");
  });

  // Decrypt private key
  it("should securely decrypt and encrypted private key using the origin password", async () => {
    const decryptedPrivateKeyJson = await decryptE2EKey(
      senderKeys.encryptedPrivateKey,
      mockPassword,
    );

    expect(decryptedPrivateKeyJson).toBe(senderKeys.privateKey);
  });

  it("should refuse decryption and throw an error if the password is wrong", async () => {
    await expect(
      decryptE2EKey(senderKeys.encryptedPrivateKey, "WrongPassword!!"),
    ).rejects.toThrow();
  });

  it("should encrypt a message payload targeting both sender and recipient public keys", async () => {
    encryptedMsgPayload = await encryptMessage(
      cleartextMessage,
      senderKeys.publicKey,
      recipientKeys.publicKey,
    );

    expect(encryptedMsgPayload).toHaveProperty("encryptedContent");
    expect(encryptedMsgPayload).toHaveProperty("iv");
    expect(encryptedMsgPayload).toHaveProperty("senderEncryptedKey");
    expect(encryptedMsgPayload).toHaveProperty("recipientEncryptedKey");

    expect(encryptedMsgPayload.encryptedContent).not.toContain(
      cleartextMessage,
    );
  });

  it("should allow the recipient to decrypt the message using their private key", async () => {
    const decryptedText = await decryptMessage(
      encryptedMsgPayload,
      recipientKeys.privateKey,
      false,
    );

    expect(decryptedText).toBe(cleartextMessage);
  });

  it("should allow the sender to decrypt the mesage using their own private key copy", async () => {
    const decryptedText = await decryptMessage(
      encryptedMsgPayload,
      senderKeys.privateKey,
      true,
    );

    expect(decryptedText).toBe(cleartextMessage);
  });

  it("should fail gracefully and throw an error if the encrypted payload is tempered with", async () => {
    const corruptedPayload = { ...encryptedMsgPayload };
    corruptedPayload.encryptedContent =
      corruptedPayload.encryptedContent.replace(/^./, "a");

    await expect(
      decryptMessage(corruptedPayload, recipientKeys.privateKey, false),
    ).rejects.toThrow();
  });
});
