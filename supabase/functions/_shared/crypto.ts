// AES-GCM encrypt/decrypt for storing buyer secret keys at rest.
// ENCRYPTION_KEY must be a 32-byte value, base64-encoded, set as a Supabase
// secret (never commit it, never put it in frontend code).

async function getKey(rawKeyB64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(rawKeyB64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptSecret(
  plaintext: string,
  rawKeyB64: string
): Promise<string> {
  const key = await getKey(rawKeyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  // Store iv + ciphertext together, base64-encoded, so decrypt can pull the iv back out.
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptSecret(
  stored: string,
  rawKeyB64: string
): Promise<string> {
  const key = await getKey(rawKeyB64);
  const combined = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintextBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintextBuf);
}