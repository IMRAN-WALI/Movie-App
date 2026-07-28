// MUST be imported before crypto-js — this polyfills a secure random
// number generator for React Native (crypto-js needs it to generate IVs).
import "react-native-get-random-values";
import CryptoJS from "crypto-js";

/**
 * Derives a room-specific AES key from the party's invite code + party id.
 * This key is NEVER sent to or stored on the server — every member
 * re-derives it locally from data they already have (the invite code they
 * used to join, and the party id from the URL/route).
 */
export function deriveRoomKey(partyId, inviteCode) {
  if (!partyId || !inviteCode) return null;
  const passphrase = `${inviteCode}:${partyId}`;
  // PBKDF2 stretches the passphrase into a strong 256-bit key.
  const key = CryptoJS.PBKDF2(passphrase, "movie-app-party-salt", {
    keySize: 256 / 32,
    iterations: 1000,
  });
  return key.toString(); // hex string, stable for this room
}

/**
 * Encrypts plain text with the room key. Returns "ivHex:cipherHex",
 * safe to store in the `content` column. A fresh random IV is generated
 * per message so identical messages don't produce identical ciphertext.
 */
export function encryptMessage(plainText, roomKey) {
  if (!roomKey) return plainText; // no key yet — fail open, don't lose the message
  try {
    const key = CryptoJS.enc.Hex.parse(roomKey);
    const iv = CryptoJS.lib.WordArray.random(16);

    const encrypted = CryptoJS.AES.encrypt(plainText, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return `${iv.toString(CryptoJS.enc.Hex)}:${encrypted.ciphertext.toString(CryptoJS.enc.Hex)}`;
  } catch (err) {
    console.error("❌ encryptMessage failed:", err);
    return plainText;
  }
}

/**
 * Decrypts a "ivHex:cipherHex" string with the room key. Returns readable
 * text, or the original string unchanged if it isn't valid ciphertext for
 * this key (e.g. an old unencrypted message sent before this feature).
 */
export function decryptMessage(cipherText, roomKey) {
  if (!roomKey || !cipherText || !cipherText.includes(":")) return cipherText;

  try {
    const [ivHex, dataHex] = cipherText.split(":");
    const key = CryptoJS.enc.Hex.parse(roomKey);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const ciphertext = CryptoJS.enc.Hex.parse(dataHex);

    const decrypted = CryptoJS.AES.decrypt({ ciphertext }, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const text = decrypted.toString(CryptoJS.enc.Utf8);
    return text || "🔒 Unable to decrypt message";
  } catch (err) {
    // Not valid ciphertext for this key — treat as a plain old message.
    return cipherText;
  }
}
