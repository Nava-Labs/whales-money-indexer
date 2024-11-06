export const blacklistedAddress = [
  "0x0000000000000000000000000000000000000000",
  "0xe42c7d8ed302e12bd5e36c34bfc34188abc9670f",
];

export function isBlacklisted(address: string): boolean {
  for (let i = 0; i < blacklistedAddress.length; i++) {
    if (blacklistedAddress[i].toLowerCase() == address.toLowerCase()) {
      return true;
    }
  }
  return false;
}
