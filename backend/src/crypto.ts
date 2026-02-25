export function isValidHexString(str: string, expectedBytes: number): boolean {
  return /^[0-9a-fA-F]+$/.test(str) && str.length === expectedBytes * 2;
}
