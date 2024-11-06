export const blacklistedAddress = [
  "0x0000000000000000000000000000000000000000",
  "0x42fa6d207347a6c8472a5904e86310bca48c85ac",
];

export function isBlacklisted(address: string): boolean {
  for (let i = 0; i < blacklistedAddress.length; i++) {
    if (blacklistedAddress[i].toLowerCase() == address.toLowerCase()) {
      return true;
    }
  }
  return false;
}
