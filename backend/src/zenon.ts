import { Address } from "znn-typescript-sdk/primitives";
import { Buffer } from "buffer";

export function validateZenonAddress(address: string): boolean {
  try {
    const parsed = Address.parse(address);
    return parsed.toString() === address;
  } catch {
    return false;
  }
}

export function deriveZenonAddressFromPublicKeyHex(publicKeyHex: string): string {
  const publicKey = Buffer.from(publicKeyHex, "hex");
  return Address.fromPublicKey(publicKey).toString();
}

export function addressMatchesPublicKey(address: string, publicKeyHex: string): boolean {
  try {
    const canonicalAddress = Address.parse(address).toString();
    const derivedAddress = deriveZenonAddressFromPublicKeyHex(publicKeyHex);
    return canonicalAddress === derivedAddress;
  } catch {
    return false;
  }
}
