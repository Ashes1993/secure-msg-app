interface E2EKeyPairPayload {
  publicKey: string;
  privateKey: string;
  encryptedPrivateKey: string;
}

interface EncryptedMessagePayload {
  encryptedContent: string;
  iv: string;
  senderEncryptedKey: string;
  recipientEncryptedKey: string;
}

// Helper: Converts raw binary buffers into database-safe hexadecimal text strings
const bufferToHex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

// Helper: Converts a database-safe hexadecimal text string back into a raw binary ArrayBuffer
const hexToBuffer = (hex: string): ArrayBuffer => {
  const pairs = hex.match(/[\da-f]{2}/gi) || [];
  const bytes = new Uint8Array(pairs.map((h) => parseInt(h, 16)));
  return bytes.buffer;
};

// Creates key pairs for E2E encryption
export const generateE2EKeys = async (
  password: string,
): Promise<E2EKeyPairPayload> => {
  // Generate an isolated asymmetric cryptographic key pair
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );

  // Serialize the keys into readable JWK structures
  const exportedPublicKey = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.publicKey,
  );
  const exportedPrivateKey = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.privateKey,
  );

  // Prepare the user's password to act as a cryptographic foundation layer
  const binaryPassword = new TextEncoder().encode(password);
  const basePasswordKey = await window.crypto.subtle.importKey(
    "raw",
    binaryPassword,
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  // Generate a unique, random 16-byte salt to prevent rainbow-table collision attacks
  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  // Upgradde the password key into a high-securoty 256-bit symmetric encryption key
  const symmetricKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    basePasswordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  // Convert the plaintext JWK private key into binary bytes so the encryption engine can read it
  const privateKeyBytes = new TextEncoder().encode(
    JSON.stringify(exportedPrivateKey),
  );

  // Generate a distinct initialization vector to ensure cipher variation across users
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Execute semmetric encryption using the derived AES key
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    symmetricKey,
    privateKeyBytes,
  );

  // Serialize the binary segments into safe hexadecimal string formats for database storage
  const ciphertextHex = bufferToHex(ciphertextBuffer);
  const ivHex = bufferToHex(iv.buffer);
  const saltHex = bufferToHex(salt.buffer);

  // Assemble the encrypted package
  const encryptedPrivateKeyPayload = `${ciphertextHex}.${ivHex}.${saltHex}`;

  return {
    publicKey: JSON.stringify(exportedPublicKey),
    privateKey: JSON.stringify(exportedPrivateKey),
    encryptedPrivateKey: encryptedPrivateKeyPayload,
  };
};

// Decrypts an encrypted asymmetric private key payload using the user's password
export const decryptE2EKey = async (
  encryptedPayload: string,
  password: string,
): Promise<string> => {
  // Deconstruct the unified payload string using our dot delimiter
  const [ciphertextHex, ivHex, saltHex] = encryptedPayload.split(".");
  if (!ciphertextHex || !ivHex || !saltHex) {
    throw new Error("Invalid cryptographic payload structure encountered.");
  }

  // Hydrate the hex strings back into raw binary memory blocks
  const ciphertextBuffer = hexToBuffer(ciphertextHex);
  const ivBuffer = hexToBuffer(ivHex);
  const saltBuffer = hexToBuffer(saltHex);

  // Prepare the plain text login password for temporary base key conversion
  const binaryPassword = new TextEncoder().encode(password);
  const basePasswordKey = await window.crypto.subtle.importKey(
    "raw",
    binaryPassword,
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  // Regenerate the identical 256-bit symmetric AES key using the extracted salt
  const symmetricKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    basePasswordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  // Execute symmetric decryption to unlock the raw ciphertext buffer
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
    symmetricKey,
    ciphertextBuffer,
  );

  // Translate the unlocked binary byte buffer back into a standard readable JSON string
  const stringifiedPrivateKey = new TextDecoder().decode(decryptedBuffer);

  return stringifiedPrivateKey;
};

// Encrpts a message using a temporary symmetric AES key.
export const encryptMessage = async (
  plaintext: string,
  senderPublicKeyJwk: string,
  recipientPublicKeyJwk: string,
): Promise<EncryptedMessagePayload> => {
  // Rehydrate raw JWK strings into cryptographic key objects
  const senderKey = await window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(senderPublicKeyJwk),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  );

  const recipientKey = await window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(recipientPublicKeyJwk),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  );

  // Generate a secure 256-bit synnetric AES key for this message
  const messageKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  // Convert plaintext into binary bytes and encrypt it with AES-GCM
  const textBytes = new TextEncoder().encode(plaintext);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedContentBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    messageKey,
    textBytes,
  );

  // Export the raw binary key of the AES key so it can be locked via RSA
  const rawMessageKeyBuffer = await window.crypto.subtle.exportKey(
    "raw",
    messageKey,
  );

  // Asymmetrically encrypt that single AES key buffer for both participants
  const senderWrappedKeyBuffer = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    senderKey,
    rawMessageKeyBuffer,
  );

  const recipientWrappedKeyBuffer = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientKey,
    rawMessageKeyBuffer,
  );

  return {
    encryptedContent: bufferToHex(encryptedContentBuffer),
    iv: bufferToHex(iv.buffer),
    senderEncryptedKey: bufferToHex(senderWrappedKeyBuffer),
    recipientEncryptedKey: bufferToHex(recipientWrappedKeyBuffer),
  };
};

// Unlocks the wrapped symmetric AES key using the RSA private key.
export const decryptMessage = async (
  payload: EncryptedMessagePayload,
  myPrivateKeyJwk: string,
  isSender: boolean,
): Promise<string> => {
  // Rehydrate the asymmetric RSA private key into memory
  const privateKey = await window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(myPrivateKeyJwk),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"],
  );

  // Extract the correct hex-string block depending on the role in this conversation
  const targetKeyHex = isSender
    ? payload.senderEncryptedKey
    : payload.recipientEncryptedKey;
  const wrappedKeyBuffer = hexToBuffer(targetKeyHex);

  // Use private key to decrypt the raw binary bytes of the original AES key
  const rawMessageKeyBuffer = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    wrappedKeyBuffer,
  );

  // Convert those raw decrypted bytes back into an active symmetric AES CryptoKey object
  const messageKey = await window.crypto.subtle.importKey(
    "raw",
    rawMessageKeyBuffer,
    "AES-GCM",
    true,
    ["decrypt"],
  );

  // Decrypt the main text block using the symmetric key and its original unique IV
  const contentBuffer = hexToBuffer(payload.encryptedContent);
  const ivBuffer = hexToBuffer(payload.iv);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
    messageKey,
    contentBuffer,
  );

  // Translate the binary byte array back into standard readable plaintext
  return new TextDecoder().decode(decryptedBuffer);
};
