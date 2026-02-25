import { Buffer } from "buffer";
import { Crypto } from "znn-typescript-sdk/crypto";
import { Address } from "znn-typescript-sdk/primitives";

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getAddressFromPrivateKey(privateKeyHex: string): string {
  const privateKeyBytes = hexToBytes(privateKeyHex);
  const publicKey = Crypto.getPublicKey(Buffer.from(privateKeyBytes));
  return Address.fromPublicKey(publicKey).toString();
}

export function signChallenge(challenge: string, privateKeyHex: string): { publicKeyHex: string; signatureHex: string } {
  const privateKeyBytes = hexToBytes(privateKeyHex);
  const publicKey = Crypto.getPublicKey(Buffer.from(privateKeyBytes));
  const signature = Crypto.sign(
    Buffer.from(new TextEncoder().encode(challenge)),
    Buffer.from(privateKeyBytes),
  );

  return {
    publicKeyHex: bytesToHex(publicKey),
    signatureHex: bytesToHex(signature),
  };
}

export function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const [, payload] = jwt.split(".");
  const padded = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
  return JSON.parse(atob(padded));
}
